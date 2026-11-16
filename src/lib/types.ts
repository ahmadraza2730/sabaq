export type ResourceType = "notes" | "past_paper" | "assignment";
export type ResourceStatus = "pending" | "approved" | "rejected";

export type Course = {
  id: string;
  code: string;
  title: string;
  semester: number;
  university_slug: string;
  university_name: string;
  resource_count: number;
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

export function isResourceType(value: unknown): value is ResourceType {
  return value === "notes" || value === "past_paper" || value === "assignment";
}
