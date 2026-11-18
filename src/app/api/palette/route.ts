import { NextResponse } from "next/server";
import { listCourses } from "@/lib/data";
import { listPastPapers } from "@/lib/pastPapers";
import { listProblems } from "@/lib/practice";

// Everything the Ctrl+K search can jump to. Public data only, cached for an hour.
export const revalidate = 3600;

export async function GET() {
  const [courses, papers] = await Promise.all([listCourses(), listPastPapers()]);
  const folders = new Map<string, { folder: string; code: string | null; semester: number | null; count: number }>();
  for (const p of papers) {
    if (p.kind === "Course outline") continue;
    const key = `${p.semester}:${p.folder}`;
    const f = folders.get(key) ?? { folder: p.folder, code: p.courseCode, semester: p.semester, count: 0 };
    f.count++;
    folders.set(key, f);
  }
  return NextResponse.json({
    courses: courses.map((c) => ({ code: c.code, title: c.title, uni: c.university_slug })),
    papers: [...folders.values()],
    problems: listProblems().map((p) => ({ slug: p.slug, title: p.title, track: p.track, difficulty: p.difficulty })),
  });
}
