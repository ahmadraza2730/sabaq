import { type CourseCandidate, matchCourse } from "@/lib/matchCourse";
import { isForMySection, type StudentSection } from "@/lib/sections";
import type { createClient } from "@/lib/supabase/server";

// Google Classroom sync. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// from a Google Cloud OAuth client with the Classroom API enabled.

type Client = Awaited<ReturnType<typeof createClient>>;

// Non-sensitive: lets Sabaq create its own "Sabaq due dates" calendar and
// manage events in it, without access to the student's other calendars.
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";

export const CLASSROOM_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.topics.readonly",
  CALENDAR_SCOPE,
].join(" ");

export function isClassroomConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/google/callback`;
}

export async function exchangeCode(code: string, origin: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google sign-in failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    scope?: string;
  };

  // The id_token came straight from Google over TLS, so reading its
  // payload without verifying the signature is safe here.
  let email: string | null = null;
  if (json.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(json.id_token.split(".")[1], "base64url").toString("utf8"),
      ) as { email?: string };
      email = payload.email ?? null;
    } catch {
      email = null;
    }
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    email,
    calendar: (json.scope ?? "").split(" ").includes(CALENDAR_SCOPE),
  };
}

export async function accessTokenFrom(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error("Google access expired. Connect Classroom again.");
  }
  return ((await response.json()) as { access_token: string }).access_token;
}

class ClassroomScopeMissing extends Error {}

async function classroomGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://classroom.googleapis.com/v1/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403 && /disabled|not been used/i.test(detail)) {
      throw new Error("The Classroom API is not enabled for this site yet.");
    }
    if (response.status === 403 && /insufficient|scope/i.test(detail)) {
      throw new ClassroomScopeMissing(path);
    }
    if (response.status === 403) {
      throw new Error(
        "Google refused access to Classroom. Your university's Google admin may block outside apps.",
      );
    }
    throw new Error(`Classroom request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

/** Follow nextPageToken for list endpoints (up to `pages` pages). */
async function classroomList<T>(path: string, key: string, token: string, pages = 5): Promise<T[]> {
  const out: T[] = [];
  let pageToken = "";
  for (let i = 0; i < pages; i++) {
    const sep = path.includes("?") ? "&" : "?";
    const page = await classroomGet<Record<string, unknown> & { nextPageToken?: string }>(
      `${path}${pageToken ? `${sep}pageToken=${encodeURIComponent(pageToken)}` : ""}`,
      token,
    );
    out.push(...((page[key] as T[] | undefined) ?? []));
    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }
  return out;
}

/** Like classroomList, but an endpoint the student never allowed returns null. */
async function classroomOptional<T>(path: string, key: string, token: string) {
  try {
    return await classroomList<T>(path, key, token);
  } catch (error) {
    if (error instanceof ClassroomScopeMissing) return null;
    throw error;
  }
}

type GDate = { year: number; month: number; day: number };
type GTime = { hours?: number; minutes?: number };

function dueAt(date?: GDate, time?: GTime) {
  if (!date) return null;
  // Classroom gives due dates in UTC.
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day, time?.hours ?? 23, time?.minutes ?? 59),
  ).toISOString();
}

// ---------- Files attached in Classroom ----------

type GMaterial = {
  driveFile?: { driveFile?: { id?: string; title?: string; alternateLink?: string } };
  youtubeVideo?: { id?: string; title?: string; alternateLink?: string };
  link?: { url?: string; title?: string };
  form?: { formUrl?: string; title?: string };
};

export type FileType = "slides" | "pdf" | "doc" | "sheet" | "video" | "link" | "form" | "file";

function fileTypeOf(title: string, url: string): FileType {
  const t = title.toLowerCase();
  if (/\/presentation\//.test(url) || /\.(pptx?|ppsx?|key|odp)$/.test(t)) return "slides";
  if (/\.pdf$/.test(t)) return "pdf";
  if (/\/document\//.test(url) || /\.(docx?|odt|rtf|txt)$/.test(t)) return "doc";
  if (/\/spreadsheets\//.test(url) || /\.(xlsx?|csv|ods)$/.test(t)) return "sheet";
  if (/youtube\.com|youtu\.be/.test(url) || /\.(mp4|mkv|mov)$/.test(t)) return "video";
  return "file";
}

function readMaterials(materials: GMaterial[] | undefined) {
  const out: { key: string; title: string; url: string; type: FileType }[] = [];
  for (const m of materials ?? []) {
    if (m.driveFile?.driveFile?.alternateLink) {
      const f = m.driveFile.driveFile;
      const title = f.title || "Untitled file";
      out.push({ key: `d:${f.id ?? f.alternateLink}`, title, url: f.alternateLink!, type: fileTypeOf(title, f.alternateLink!) });
    } else if (m.youtubeVideo?.alternateLink) {
      out.push({
        key: `y:${m.youtubeVideo.id ?? m.youtubeVideo.alternateLink}`,
        title: m.youtubeVideo.title || "Video",
        url: m.youtubeVideo.alternateLink,
        type: "video",
      });
    } else if (m.link?.url) {
      const type = fileTypeOf(m.link.title || m.link.url, m.link.url);
      out.push({ key: `l:${m.link.url}`, title: m.link.title || m.link.url, url: m.link.url, type: type === "file" ? "link" : type });
    } else if (m.form?.formUrl) {
      out.push({ key: `f:${m.form.formUrl}`, title: m.form.title || "Form", url: m.form.formUrl, type: "form" });
    }
  }
  return out;
}

type StudentInfo = StudentSection;

async function loadStudent(supabase: Client, userId: string): Promise<StudentInfo> {
  const { data } = await supabase
    .from("profiles")
    .select("program, current_semester, section")
    .eq("id", userId)
    .maybeSingle();
  return {
    program: (data?.program as string | null) ?? null,
    semester: (data?.current_semester as number | null) ?? null,
    section: (data?.section as string | null) ?? null,
  };
}

async function loadCandidates(supabase: Client, program: string | null): Promise<CourseCandidate[]> {
  const [{ data: courses }, { data: mine }] = await Promise.all([
    supabase.from("courses").select("id, code, title").limit(1000),
    program
      ? supabase.from("program_courses").select("course_id").eq("program", program)
      : Promise.resolve({ data: [] as { course_id: string }[] }),
  ]);
  const preferred = new Set((mine ?? []).map((r) => r.course_id as string));
  return (courses ?? []).map((c) => ({
    id: c.id as string,
    code: c.code as string,
    title: c.title as string,
    preferred: preferred.has(c.id as string),
  }));
}

type GCourse = { id: string; name: string; section?: string; alternateLink?: string };

/**
 * Pull the student's active Classroom classes: assignments into My work
 * (marked when they are for another section), and every attached file into
 * the Slides list.
 */
export async function syncClassroom(supabase: Client, userId: string) {
  const { data: connection } = await supabase
    .from("google_connections")
    .select("refresh_token, calendar_enabled")
    .eq("user_id", userId)
    .single();
  if (!connection) throw new Error("Connect Google Classroom first.");

  const token = await accessTokenFrom(connection.refresh_token);
  const [student, courses] = await Promise.all([
    loadStudent(supabase, userId),
    classroomList<GCourse>("courses?studentId=me&courseStates=ACTIVE&pageSize=50", "courses", token, 2),
  ]);
  const candidates = await loadCandidates(supabase, student.program);

  const taskRows: Record<string, unknown>[] = [];
  const materialRows: Record<string, unknown>[] = [];
  const courseRows: Record<string, unknown>[] = [];
  let filesAllowed = true;

  await Promise.all(
    courses.map(async (course) => {
      const label = course.section ? `${course.name} (${course.section})` : course.name;
      const courseForMe = isForMySection([course.name, course.section], student);
      courseRows.push({
        user_id: userId,
        external_id: course.id,
        name: course.name.slice(0, 200),
        section: course.section?.slice(0, 100) ?? null,
        link: course.alternateLink ?? null,
        course_id: matchCourse(`${course.name} ${course.section ?? ""}`, candidates),
        synced_at: new Date().toISOString(),
      });

      type GWork = {
        id: string;
        title: string;
        description?: string;
        alternateLink?: string;
        dueDate?: GDate;
        dueTime?: GTime;
        state?: string;
        topicId?: string;
        creationTime?: string;
        materials?: GMaterial[];
      };
      const [work, submissions, topics, materials, announcements] = await Promise.all([
        classroomList<GWork>(`courses/${course.id}/courseWork?pageSize=100&orderBy=dueDate%20desc`, "courseWork", token),
        classroomList<{ courseWorkId: string; state: string }>(
          `courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=200`,
          "studentSubmissions",
          token,
        ),
        classroomOptional<{ topicId: string; name: string }>(`courses/${course.id}/topics?pageSize=100`, "topic", token),
        classroomOptional<{
          id: string;
          title?: string;
          description?: string;
          alternateLink?: string;
          topicId?: string;
          state?: string;
          creationTime?: string;
          materials?: GMaterial[];
        }>(`courses/${course.id}/courseWorkMaterials?pageSize=100`, "courseWorkMaterial", token),
        classroomOptional<{
          id: string;
          text?: string;
          alternateLink?: string;
          state?: string;
          creationTime?: string;
          materials?: GMaterial[];
        }>(`courses/${course.id}/announcements?pageSize=100`, "announcements", token),
      ]);
      if (materials === null || announcements === null) filesAllowed = false;

      const topicName = new Map((topics ?? []).map((t) => [t.topicId, t.name]));
      const state = new Map(submissions.map((s) => [s.courseWorkId, s.state]));

      const addFiles = (
        source: "material" | "announcement" | "assignment",
        post: { id: string; title: string | null; link?: string; topic?: string | null; createdAt?: string },
        files: GMaterial[] | undefined,
        forMe: boolean,
      ) => {
        if (!forMe) return;
        for (const f of readMaterials(files)) {
          materialRows.push({
            user_id: userId,
            external_id: `${course.id}:${post.id}:${f.key}`.slice(0, 500),
            classroom_course: course.id,
            source,
            post_title: post.title?.slice(0, 300) ?? null,
            topic: post.topic?.slice(0, 200) ?? null,
            title: f.title.slice(0, 300),
            url: f.url,
            file_type: f.type,
            post_link: post.link ?? null,
            posted_at: post.createdAt ?? null,
          });
        }
      };

      for (const item of work) {
        if (item.state && item.state !== "PUBLISHED") continue;
        const topic = item.topicId ? topicName.get(item.topicId) ?? null : null;
        const forMe = courseForMe && isForMySection([item.title, topic], student);
        const submission = state.get(item.id);
        taskRows.push({
          user_id: userId,
          source: "classroom",
          external_id: item.id,
          title: item.title.slice(0, 200),
          notes: item.description?.slice(0, 2000) ?? null,
          group_label: label,
          due_at: dueAt(item.dueDate, item.dueTime),
          done: submission === "TURNED_IN" || submission === "RETURNED",
          link: item.alternateLink ?? null,
          other_section: !forMe,
        });
        addFiles("assignment", { id: item.id, title: item.title, link: item.alternateLink, topic, createdAt: item.creationTime }, item.materials, forMe);
      }
      for (const item of materials ?? []) {
        if (item.state && item.state !== "PUBLISHED") continue;
        const topic = item.topicId ? topicName.get(item.topicId) ?? null : null;
        const forMe = courseForMe && isForMySection([item.title, topic], student);
        addFiles("material", { id: item.id, title: item.title ?? null, link: item.alternateLink, topic, createdAt: item.creationTime }, item.materials, forMe);
      }
      for (const item of announcements ?? []) {
        if (item.state && item.state !== "PUBLISHED") continue;
        const firstLine = item.text?.split("\n")[0]?.slice(0, 200) ?? null;
        const forMe = courseForMe && isForMySection([firstLine], student);
        addFiles("announcement", { id: item.id, title: firstLine, link: item.alternateLink, createdAt: item.creationTime }, item.materials, forMe);
      }
    }),
  );

  // Save classes, then replace this student's Classroom tasks and files with what Google has now.
  if (courseRows.length) {
    const { error } = await supabase.from("classroom_courses").upsert(courseRows, { onConflict: "user_id,external_id" });
    if (error) throw new Error(`Could not save Classroom classes: ${error.message}`);
  }
  const keepCourses = courseRows.map((c) => c.external_id as string);
  await supabase
    .from("classroom_courses")
    .delete()
    .eq("user_id", userId)
    .not("external_id", "in", `(${keepCourses.map((id) => `"${id}"`).join(",") || '""'})`);

  for (let i = 0; i < taskRows.length; i += 200) {
    const { error } = await supabase
      .from("tasks")
      .upsert(taskRows.slice(i, i + 200), { onConflict: "user_id,source,external_id" });
    if (error) throw new Error(`Could not save Classroom work: ${error.message}`);
  }
  // Remove Classroom work that was deleted or unpublished in Classroom.
  const keepTasks = new Set(taskRows.map((r) => r.external_id as string));
  const { data: existing } = await supabase
    .from("tasks")
    .select("id, external_id")
    .eq("user_id", userId)
    .eq("source", "classroom");
  const stale = (existing ?? []).filter((t) => !keepTasks.has(t.external_id as string)).map((t) => t.id as string);
  for (let i = 0; i < stale.length; i += 100) {
    await supabase.from("tasks").delete().in("id", stale.slice(i, i + 100));
  }

  if (filesAllowed) {
    await supabase.from("classroom_materials").delete().eq("user_id", userId);
    const seen = new Set<string>();
    const unique = materialRows.filter((r) => {
      const key = r.external_id as string;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    for (let i = 0; i < unique.length; i += 300) {
      const { error } = await supabase.from("classroom_materials").insert(unique.slice(i, i + 300));
      if (error) throw new Error(`Could not save Classroom files: ${error.message}`);
    }
  }

  await supabase
    .from("google_connections")
    .update({ last_synced_at: new Date().toISOString(), scopes: filesAllowed ? "files" : "basic" })
    .eq("user_id", userId);

  let events = 0;
  if (connection.calendar_enabled) {
    events = await pushToCalendar(supabase, userId, token).catch((error: unknown) => {
      console.error("Calendar sync failed", error);
      return 0;
    });
  }

  return {
    courses: courses.length,
    items: taskRows.filter((r) => !r.other_section).length,
    otherSection: taskRows.filter((r) => r.other_section).length,
    files: filesAllowed ? materialRows.length : null,
    events,
  };
}

// ---------- Google Calendar ----------

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function calendarCall(token: string, method: string, path: string, body?: unknown) {
  return fetch(`${CALENDAR_API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function eventsPath(calendarId: string, eventId = "") {
  return `/calendars/${encodeURIComponent(calendarId)}/events${eventId ? `/${encodeURIComponent(eventId)}` : ""}`;
}

type CalendarTask = {
  id: string;
  title: string;
  notes: string | null;
  group_label: string | null;
  due_at: string | null;
  done: boolean;
  link: string | null;
  calendar_event_id: string | null;
  other_section?: boolean;
};

function eventFor(task: CalendarTask, siteUrl: string) {
  const end = new Date(task.due_at as string);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const lines = [
    task.group_label,
    task.notes?.slice(0, 1500),
    task.link ? `Open: ${task.link}` : null,
    `My work on Sabaq: ${siteUrl}/tasks`,
  ].filter(Boolean);
  return {
    summary: `Due: ${task.title}`,
    description: lines.join("\n\n"),
    start: { dateTime: start.toISOString(), timeZone: "Asia/Karachi" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Karachi" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 120 },
      ],
    },
    extendedProperties: { private: { sabaqTaskId: task.id } },
    source: { title: "Sabaq", url: `${siteUrl}/tasks` },
  };
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://sabaq-black.vercel.app")
  );
}

type Connection = { refresh_token: string; calendar_enabled: boolean; calendar_id: string | null };

async function loadConnection(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("google_connections")
    .select("refresh_token, calendar_enabled, calendar_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Connection | null;
}

/** Create the student's "Sabaq due dates" calendar and remember its id. */
async function createSabaqCalendar(supabase: Client, userId: string, token: string) {
  const response = await calendarCall(token, "POST", "/calendars", {
    summary: "Sabaq due dates",
    description: `Assignment due dates from Sabaq (${siteUrl()}/tasks). Sabaq only changes this calendar.`,
    timeZone: "Asia/Karachi",
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403 && /disabled|not been used/i.test(detail)) {
      throw new Error("The Google Calendar API is not enabled for this site yet.");
    }
    throw new Error(`Could not create the Sabaq calendar (${response.status}).`);
  }
  const { id } = (await response.json()) as { id: string };
  await supabase.from("google_connections").update({ calendar_id: id }).eq("user_id", userId);
  // A new calendar holds none of the old events.
  await supabase.from("tasks").update({ calendar_event_id: null }).eq("user_id", userId);
  return id;
}

/**
 * Mirror the student's tasks into their "Sabaq due dates" calendar: open tasks
 * with a future due date get an event (with reminders a day and two hours
 * before); finished or deleted tasks lose theirs.
 */
export async function pushToCalendar(supabase: Client, userId: string, token?: string) {
  const connection = await loadConnection(supabase, userId);
  if (!connection?.calendar_enabled) return 0;
  token ??= await accessTokenFrom(connection.refresh_token);

  let calendarId = connection.calendar_id ?? (await createSabaqCalendar(supabase, userId, token));

  const now = new Date().toISOString();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, notes, group_label, due_at, done, link, calendar_event_id, other_section")
    .eq("user_id", userId)
    .or(`calendar_event_id.not.is.null,and(done.eq.false,due_at.gte.${now})`)
    .order("due_at", { ascending: true })
    .limit(150);

  const url = siteUrl();
  let changed = 0;
  let recreated = false;
  for (const task of (tasks ?? []) as CalendarTask[]) {
    const wanted = !task.done && !task.other_section && task.due_at && task.due_at >= now;
    if (!wanted && task.calendar_event_id) {
      const response = await calendarCall(token, "DELETE", eventsPath(calendarId, task.calendar_event_id));
      if (response.ok || response.status === 404 || response.status === 410) {
        await supabase.from("tasks").update({ calendar_event_id: null }).eq("id", task.id);
        changed++;
      }
      continue;
    }
    if (!wanted) continue;

    if (task.calendar_event_id) {
      const response = await calendarCall(
        token,
        "PATCH",
        eventsPath(calendarId, task.calendar_event_id),
        eventFor(task, url),
      );
      if (response.ok) continue;
      if (response.status !== 404 && response.status !== 410) continue;
      // The student deleted the event; make a fresh one below.
    }
    let response = await calendarCall(token, "POST", eventsPath(calendarId), eventFor(task, url));
    if (response.status === 404 && !recreated) {
      // The student deleted the whole Sabaq calendar; make it again once.
      recreated = true;
      calendarId = await createSabaqCalendar(supabase, userId, token);
      response = await calendarCall(token, "POST", eventsPath(calendarId), eventFor(task, url));
    }
    if (!response.ok) {
      console.error("Calendar insert failed", response.status, await response.text());
      continue;
    }
    const event = (await response.json()) as { id: string };
    await supabase.from("tasks").update({ calendar_event_id: event.id }).eq("id", task.id);
    changed++;
  }
  return changed;
}

/** Remove one event, used when a task is deleted. */
export async function removeCalendarEvent(supabase: Client, userId: string, eventId: string) {
  const connection = await loadConnection(supabase, userId);
  if (!connection?.calendar_enabled || !connection.calendar_id) return;
  const token = await accessTokenFrom(connection.refresh_token);
  await calendarCall(token, "DELETE", eventsPath(connection.calendar_id, eventId));
}

export async function revokeGoogle(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
    method: "POST",
  }).catch(() => undefined);
}
