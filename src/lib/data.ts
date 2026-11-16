import { cache } from "react";
import { DEFAULT_UNIVERSITY, isConfigured } from "@/lib/config";
import { sampleCourses, sampleResources } from "@/lib/sample";
import { createClient } from "@/lib/supabase/server";
import type {
  Campus,
  Course,
  Reply,
  Resource,
  ResourceType,
  TeamKind,
  TeamPost,
  Thread,
  University,
} from "@/lib/types";

/** Strip characters that have meaning inside a PostgREST filter. */
function cleanQuery(q: string) {
  return q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
}

// ---------- Universities and courses ----------

export const listUniversities = cache(async (): Promise<University[]> => {
  if (!isConfigured) {
    return [
      {
        id: "sample-fast",
        slug: "fast-nuces",
        name: "National University of Computer and Emerging Sciences",
        short_name: "FAST-NUCES",
        course_count: sampleCourses.length,
        resource_count: sampleResources.length,
      },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("university_feed")
    .select("*")
    .order("short_name");
  if (error) throw new Error(`Could not load universities: ${error.message}`);
  return (data ?? []) as University[];
});

export async function getUniversity(slug: string) {
  return (await listUniversities()).find((u) => u.slug === slug) ?? null;
}

export async function listCampuses(): Promise<Campus[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campuses")
    .select("id, name, university_id, universities(short_name, slug)")
    .order("name");
  if (error) throw new Error(`Could not load campuses: ${error.message}`);
  type Row = {
    id: string;
    name: string;
    university_id: string;
    universities: { short_name: string; slug: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((row) => ({
      id: row.id,
      name: row.name,
      university_id: row.university_id,
      university_short_name: row.universities?.short_name ?? "",
      university_slug: row.universities?.slug ?? "",
    }))
    .sort((a, b) =>
      a.university_short_name === b.university_short_name
        ? a.name.localeCompare(b.name)
        : a.university_short_name.localeCompare(b.university_short_name),
    );
}

export async function listCourses(
  q = "",
  university = DEFAULT_UNIVERSITY,
): Promise<Course[]> {
  const term = cleanQuery(q);

  if (!isConfigured) {
    const needle = term.toLowerCase();
    return sampleCourses.filter(
      (c) =>
        c.university_slug === university &&
        (!needle ||
          c.code.toLowerCase().includes(needle) ||
          c.title.toLowerCase().includes(needle)),
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("course_feed")
    .select("*")
    .eq("university_slug", university)
    .order("semester")
    .order("code");
  if (term) query = query.or(`code.ilike.%${term}%,title.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load courses: ${error.message}`);
  return (data ?? []) as Course[];
}

export const getCourse = cache(
  async (university: string, code: string): Promise<Course | null> => {
    if (!isConfigured) {
      return (
        sampleCourses.find(
          (c) => c.university_slug === university && c.code === code,
        ) ?? null
      );
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_feed")
      .select("*")
      .eq("university_slug", university)
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(`Could not load the course: ${error.message}`);
    return data as Course | null;
  },
);

export async function getCourseById(id: string): Promise<Course | null> {
  if (!isConfigured) return sampleCourses.find((c) => c.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_feed")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as Course | null;
}

// ---------- Files ----------

export async function listResources(
  courseId: string,
  type?: ResourceType,
): Promise<Resource[]> {
  if (!isConfigured) {
    return sampleResources
      .filter((r) => r.course_id === courseId && (!type || r.type === type))
      .sort((a, b) => b.votes - a.votes);
  }
  const supabase = await createClient();
  let query = supabase
    .from("resource_feed")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "approved")
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load files: ${error.message}`);
  return (data ?? []) as Resource[];
}

/** Files whose title matches a search, within one university. */
export async function searchResources(
  q: string,
  university = DEFAULT_UNIVERSITY,
): Promise<Resource[]> {
  const term = cleanQuery(q);
  if (!term) return [];

  if (!isConfigured) {
    return sampleResources.filter(
      (r) =>
        r.university_slug === university &&
        r.title.toLowerCase().includes(term.toLowerCase()),
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_feed")
    .select("*")
    .eq("university_slug", university)
    .eq("status", "approved")
    .ilike("title", `%${term}%`)
    .order("votes", { ascending: false })
    .limit(20);
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as Resource[];
}

export async function listMyVotes(userId: string): Promise<Set<string>> {
  if (!isConfigured) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("resource_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((v) => v.resource_id as string));
}

export async function listMyUploads(userId: string): Promise<Resource[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_feed")
    .select("*")
    .eq("uploader_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your uploads: ${error.message}`);
  return (data ?? []) as Resource[];
}

export async function listPending(): Promise<Resource[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_feed")
    .select("*")
    .eq("status", "pending")
    .order("created_at");
  if (error) throw new Error(`Could not load the queue: ${error.message}`);
  return (data ?? []) as Resource[];
}

/** How many approved files in a course the assistant can read. */
export async function countIndexed(courseId: string): Promise<number> {
  if (!isConfigured) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("status", "approved")
    .not("indexed_at", "is", null);
  return count ?? 0;
}

// ---------- Discussion ----------

export async function listThreads(courseId: string): Promise<Thread[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("thread_feed")
    .select("*")
    .eq("course_id", courseId)
    .order("last_activity_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not load questions: ${error.message}`);
  return (data ?? []) as Thread[];
}

export async function getThread(id: string): Promise<Thread | null> {
  if (!isConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("thread_feed")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the question: ${error.message}`);
  return data as Thread | null;
}

export async function listReplies(threadId: string): Promise<Reply[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reply_feed")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at");
  if (error) throw new Error(`Could not load answers: ${error.message}`);
  return (data ?? []) as Reply[];
}

// ---------- Team finder ----------

export async function listTeamPosts(options: {
  kind?: TeamKind;
  universityId?: string;
  withContact: boolean;
}): Promise<TeamPost[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  // Signed-out visitors cannot read the contact column at all.
  const columns = [
    "id, author_id, university_id, kind, title, body, skills, is_open, created_at",
    options.withContact ? "contact" : null,
    "profiles(full_name), universities(short_name)",
  ]
    .filter(Boolean)
    .join(", ");

  let query = supabase
    .from("team_posts")
    .select(columns)
    .order("is_open", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (options.kind) query = query.eq("kind", options.kind);
  if (options.universityId) query = query.eq("university_id", options.universityId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load team posts: ${error.message}`);

  type Row = Omit<TeamPost, "author_name" | "university_short_name" | "contact"> & {
    contact?: string;
    profiles: { full_name: string } | null;
    universities: { short_name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    author_id: row.author_id,
    university_id: row.university_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    skills: row.skills,
    is_open: row.is_open,
    created_at: row.created_at,
    contact: row.contact ?? null,
    author_name: row.profiles?.full_name ?? null,
    university_short_name: row.universities?.short_name ?? null,
  }));
}
