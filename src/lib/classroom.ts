import type { createClient } from "@/lib/supabase/server";

// Google Classroom sync. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// from a Google Cloud OAuth client with the Classroom API enabled.

type Client = Awaited<ReturnType<typeof createClient>>;

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export const CLASSROOM_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
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

async function classroomGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://classroom.googleapis.com/v1/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403 && /disabled|not been used/i.test(detail)) {
      throw new Error("The Classroom API is not enabled for this site yet.");
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

type GDate = { year: number; month: number; day: number };
type GTime = { hours?: number; minutes?: number };

function dueAt(date?: GDate, time?: GTime) {
  if (!date) return null;
  // Classroom gives due dates in UTC.
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day, time?.hours ?? 23, time?.minutes ?? 59),
  ).toISOString();
}

/** Pull the student's active courses and coursework into their task list. */
export async function syncClassroom(supabase: Client, userId: string) {
  const { data: connection } = await supabase
    .from("google_connections")
    .select("refresh_token, calendar_enabled")
    .eq("user_id", userId)
    .single();
  if (!connection) throw new Error("Connect Google Classroom first.");

  const token = await accessTokenFrom(connection.refresh_token);
  const { courses = [] } = await classroomGet<{
    courses?: { id: string; name: string; section?: string }[];
  }>("courses?studentId=me&courseStates=ACTIVE&pageSize=50", token);

  const rows: Record<string, unknown>[] = [];
  for (const course of courses) {
    const [work, submissions] = await Promise.all([
      classroomGet<{
        courseWork?: {
          id: string;
          title: string;
          description?: string;
          alternateLink?: string;
          dueDate?: GDate;
          dueTime?: GTime;
          state?: string;
        }[];
      }>(`courses/${course.id}/courseWork?pageSize=100&orderBy=dueDate%20desc`, token),
      classroomGet<{
        studentSubmissions?: { courseWorkId: string; state: string }[];
      }>(`courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=200`, token),
    ]);

    const state = new Map(
      (submissions.studentSubmissions ?? []).map((s) => [s.courseWorkId, s.state]),
    );
    for (const item of work.courseWork ?? []) {
      if (item.state && item.state !== "PUBLISHED") continue;
      const submission = state.get(item.id);
      rows.push({
        user_id: userId,
        source: "classroom",
        external_id: item.id,
        title: item.title.slice(0, 200),
        notes: item.description?.slice(0, 2000) ?? null,
        group_label: course.section ? `${course.name} (${course.section})` : course.name,
        due_at: dueAt(item.dueDate, item.dueTime),
        done: submission === "TURNED_IN" || submission === "RETURNED",
        link: item.alternateLink ?? null,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase
      .from("tasks")
      .upsert(rows.slice(i, i + 200), { onConflict: "user_id,source,external_id" });
    if (error) throw new Error(`Could not save Classroom work: ${error.message}`);
  }
  await supabase
    .from("google_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);

  let events = 0;
  if (connection.calendar_enabled) {
    events = await pushToCalendar(supabase, userId, token).catch((error) => {
      console.error("Calendar sync failed", error);
      return 0;
    });
  }

  return { courses: courses.length, items: rows.length, events };
}

// ---------- Google Calendar ----------

const CALENDAR = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

async function calendarCall(token: string, method: string, path: string, body?: unknown) {
  return fetch(`${CALENDAR}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
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

/**
 * Mirror the student's tasks into their Google Calendar: open tasks with a
 * future due date get an event (with reminders a day and two hours before);
 * finished or deleted tasks lose theirs.
 */
export async function pushToCalendar(supabase: Client, userId: string, token?: string) {
  if (!token) {
    const { data: connection } = await supabase
      .from("google_connections")
      .select("refresh_token, calendar_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (!connection?.calendar_enabled) return 0;
    token = await accessTokenFrom(connection.refresh_token);
  }

  const now = new Date().toISOString();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, notes, group_label, due_at, done, link, calendar_event_id")
    .eq("user_id", userId)
    .or(`calendar_event_id.not.is.null,and(done.eq.false,due_at.gte.${now})`)
    .order("due_at", { ascending: true })
    .limit(150);

  const url = siteUrl();
  let changed = 0;
  for (const task of (tasks ?? []) as CalendarTask[]) {
    const wanted = !task.done && task.due_at && task.due_at >= now;
    if (!wanted && task.calendar_event_id) {
      const response = await calendarCall(token, "DELETE", `/${task.calendar_event_id}`);
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
        `/${task.calendar_event_id}`,
        eventFor(task, url),
      );
      if (response.ok) continue;
      if (response.status !== 404 && response.status !== 410) continue;
      // The student deleted the event in Calendar; make a fresh one below.
    }
    const response = await calendarCall(token, "POST", "", eventFor(task, url));
    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 403 && /disabled|not been used/i.test(detail)) {
        throw new Error("The Google Calendar API is not enabled for this site yet.");
      }
      console.error("Calendar insert failed", response.status, detail);
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
  const { data: connection } = await supabase
    .from("google_connections")
    .select("refresh_token, calendar_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection?.calendar_enabled) return;
  const token = await accessTokenFrom(connection.refresh_token);
  await calendarCall(token, "DELETE", `/${eventId}`);
}

export async function revokeGoogle(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
    method: "POST",
  }).catch(() => undefined);
}
