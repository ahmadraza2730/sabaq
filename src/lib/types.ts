export type ResourceType = "notes" | "past_paper" | "assignment";
export type ResourceStatus = "pending" | "approved" | "rejected";
export type TeamKind = "project" | "hackathon" | "fyp" | "study_group";

export type University = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  course_count: number;
  resource_count: number;
  city: string | null;
  sector: "public" | "private" | null;
  founded: number | null;
  website: string | null;
  featured: boolean;
  campus_count: number;
};

export type ElectiveSlot = {
  id: string;
  program: string;
  semester: number;
  code_hint: string | null;
  label: string;
  credit_hours: string | null;
  position: number;
};

export type Campus = {
  id: string;
  name: string;
  city: string | null;
  university_id: string;
  university_short_name: string;
  university_slug: string;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  semester: number;
  university_slug: string;
  university_name: string;
  resource_count: number;
  credit_hours: string | null;
  program: string | null;
  position: number | null;
};

export type Resource = {
  id: string;
  course_id: string;
  uploader_id: string;
  title: string;
  type: ResourceType;
  year: number | null;
  file_name: string;
  status: ResourceStatus;
  downloads: number;
  created_at: string;
  course_code: string;
  course_title: string;
  university_slug: string;
  uploader_name: string | null;
  campus_name: string | null;
  votes: number;
};

export type Profile = {
  id: string;
  full_name: string;
  batch: string | null;
  campus_id: string | null;
  role: "student" | "admin";
};

export type Thread = {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  last_activity_at: string;
  author_name: string | null;
  reply_count: number;
};

export type Reply = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string | null;
};

export type TeamPost = {
  id: string;
  author_id: string;
  university_id: string | null;
  kind: TeamKind;
  title: string;
  body: string;
  skills: string[];
  is_open: boolean;
  created_at: string;
  /** Only loaded for signed-in visitors. */
  contact: string | null;
  author_name: string | null;
  university_short_name: string | null;
};

export const TYPE_LABELS: Record<ResourceType, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  assignment: "Assignment",
};

export const TYPE_PLURALS: Record<ResourceType, string> = {
  notes: "Notes",
  past_paper: "Past papers",
  assignment: "Assignments",
};

export const TEAM_KIND_LABELS: Record<TeamKind, string> = {
  project: "Project",
  hackathon: "Hackathon",
  fyp: "Final year project",
  study_group: "Study group",
};

export function isResourceType(value: unknown): value is ResourceType {
  return value === "notes" || value === "past_paper" || value === "assignment";
}

export function isTeamKind(value: unknown): value is TeamKind {
  return (
    value === "project" ||
    value === "hackathon" ||
    value === "fyp" ||
    value === "study_group"
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "3+1" -> [3, 1]. Non-credit ("NC+0") and blanks count as zero. */
export function parseCredits(value: string | null): [number, number] {
  const [theory, lab] = (value ?? "").split("+").map((part) => Number(part));
  return [Number.isFinite(theory) ? theory : 0, Number.isFinite(lab) ? lab : 0];
}

export function sumCredits(values: (string | null)[]) {
  return values.reduce(
    (total, value) => {
      const [theory, lab] = parseCredits(value);
      return [total[0] + theory, total[1] + lab];
    },
    [0, 0],
  );
}
