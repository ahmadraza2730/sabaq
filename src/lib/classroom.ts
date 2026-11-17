import type { createClient } from "@/lib/supabase/server";

// Google Classroom sync. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// from a Google Cloud OAuth client with the Classroom API enabled.

type Client = Awaited<ReturnType<typeof createClient>>;

export const CLASSROOM_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
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
  return { accessToken: json.access_token, refreshToken: json.refresh_token ?? null, email };
}

async function accessTokenFrom(refreshToken: string) {
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
    .select("refresh_token")
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

  return { courses: courses.length, items: rows.length };
}

export async function revokeGoogle(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
    method: "POST",
  }).catch(() => undefined);
}
