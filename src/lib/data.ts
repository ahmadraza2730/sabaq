import { DEFAULT_UNIVERSITY, isConfigured } from "@/lib/config";
import { sampleCourses, sampleResources } from "@/lib/sample";
import { createClient } from "@/lib/supabase/server";
import type { Course, Resource, ResourceType } from "@/lib/types";

/** Strip characters that have meaning inside a PostgREST filter. */
function cleanQuery(q: string) {
  return q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
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
        !needle ||
        c.code.toLowerCase().includes(needle) ||
        c.title.toLowerCase().includes(needle),
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

export async function getCourse(
  university: string,
  code: string,
): Promise<Course | null> {
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
}

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

/** Files whose title matches a search, across all courses. */
export async function searchResources(
  q: string,
  university = DEFAULT_UNIVERSITY,
): Promise<Resource[]> {
  const term = cleanQuery(q);
  if (!term) return [];

  if (!isConfigured) {
    return sampleResources.filter((r) =>
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
