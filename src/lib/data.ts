import { cache } from "react";
import { DEFAULT_UNIVERSITY, isConfigured } from "@/lib/config";
import { sampleCourses, sampleResources, sampleSlots } from "@/lib/sample";
import { createClient } from "@/lib/supabase/server";
import type {
  Campus,
  Course,
  ElectiveSlot,
  Reply,
  Resource,
  ResourceType,
  Task,
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
        city: "Islamabad",
        sector: "private",
        founded: 2000,
        website: "https://www.nu.edu.pk",
        featured: true,
        campus_count: 6,
      },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("university_feed")
    .select("*")
    .order("featured", { ascending: false })
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
    .select("id, name, city, university_id, universities(short_name, slug)")
    .order("name");
  if (error) throw new Error(`Could not load campuses: ${error.message}`);
  type Row = {
    id: string;
    name: string;
    city: string | null;
    university_id: string;
    universities: { short_name: string; slug: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
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
    .order("position", { nullsFirst: false })
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

export async function listElectiveSlots(
  universityId: string,
  program = "CS",
): Promise<ElectiveSlot[]> {
  if (!isConfigured) return universityId === "sample-fast" && program === "CS" ? sampleSlots : [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("elective_slots")
    .select("id, program, semester, code_hint, label, credit_hours, position")
    .eq("university_id", universityId)
    .eq("program", program)
    .order("semester")
    .order("position");
  return (data ?? []) as ElectiveSlot[];
}

/**
 * The roadmap for one program: every course with the semester and order
 * it has in that program.
 */
export async function listProgramRoadmap(program: string): Promise<Course[]> {
  if (!isConfigured) return program === "CS" ? sampleCourses : [];
  const supabase = await createClient();
  const [{ data: placements, error }, courses] = await Promise.all([
    supabase.from("program_courses").select("course_id, semester, position").eq("program", program),
    listCourses("", DEFAULT_UNIVERSITY),
  ]);
  if (error) throw new Error(`Could not load the roadmap: ${error.message}`);
  const byId = new Map(courses.map((c) => [c.id, c]));
  const roadmap: Course[] = [];
  for (const p of placements ?? []) {
    const course = byId.get(p.course_id as string);
    if (course) {
      roadmap.push({ ...course, semester: p.semester as number, position: p.position as number });
    }
  }
  return roadmap.sort(
    (a, b) => a.semester - b.semester || (a.position ?? 0) - (b.position ?? 0),
  );
}

/** Courses that are in no program roadmap: electives students added. */
export async function listOtherCourses(): Promise<Course[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const [{ data: placements }, courses] = await Promise.all([
    supabase.from("program_courses").select("course_id"),
    listCourses("", DEFAULT_UNIVERSITY),
  ]);
  const placed = new Set((placements ?? []).map((p) => p.course_id as string));
  return courses.filter((c) => !placed.has(c.id));
}

// ---------- Tasks ----------

export async function listTasks(userId: string): Promise<Task[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, notes, course_id, group_label, due_at, done, source, link, created_at, other_section")
    .eq("user_id", userId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(500);
  if (error) throw new Error(`Could not load your work: ${error.message}`);
  return (data ?? []) as Task[];
}

/** Open tasks that are overdue or due within the next two days. */
export async function countDueSoon(userId: string): Promise<number> {
  if (!isConfigured) return 0;
  const supabase = await createClient();
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("done", false)
    .eq("other_section", false)
    .lte("due_at", soon);
  return count ?? 0;
}

export async function getGoogleConnection(userId: string) {
  if (!isConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_connections")
    .select("google_email, connected_at, last_synced_at, calendar_enabled, scopes")
    .eq("user_id", userId)
    .maybeSingle();
  return data as {
    google_email: string | null;
    connected_at: string;
    last_synced_at: string | null;
    calendar_enabled: boolean;
    scopes: string | null;
  } | null;
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

// ---------- Classroom files ----------

export type ClassroomFile = {
  id: number;
  classroom_course: string;
  source: "material" | "announcement" | "assignment";
  post_title: string | null;
  topic: string | null;
  title: string;
  url: string;
  file_type: "slides" | "pdf" | "doc" | "sheet" | "video" | "link" | "form" | "file";
  post_link: string | null;
  posted_at: string | null;
};

export type ClassroomClass = {
  external_id: string;
  name: string;
  section: string | null;
  link: string | null;
  course_id: string | null;
};

export async function listClassroomClasses(userId: string): Promise<ClassroomClass[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("classroom_courses")
    .select("external_id, name, section, link, course_id")
    .eq("user_id", userId)
    .order("name");
  return (data ?? []) as ClassroomClass[];
}

/** Files from the student's Classroom classes, optionally only those matched to one Sabaq course. */
export async function listClassroomFiles(userId: string, courseId?: string): Promise<ClassroomFile[]> {
  if (!isConfigured) return [];
  const supabase = await createClient();
  let classIds: string[] | null = null;
  if (courseId) {
    const { data } = await supabase
      .from("classroom_courses")
      .select("external_id")
      .eq("user_id", userId)
      .eq("course_id", courseId);
    classIds = (data ?? []).map((r) => r.external_id as string);
    if (classIds.length === 0) return [];
  }
  let query = supabase
    .from("classroom_materials")
    .select("id, classroom_course, source, post_title, topic, title, url, file_type, post_link, posted_at")
    .eq("user_id", userId)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(2000);
  if (classIds) query = query.in("classroom_course", classIds);
  const { data } = await query;
  return (data ?? []) as ClassroomFile[];
}
