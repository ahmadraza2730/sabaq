import type { Metadata } from "next";
import Link from "next/link";
import { listCampuses, listUniversities } from "@/lib/data";
import type { Campus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Universities" };

export default async function UniversitiesPage() {
  const [universities, campuses] = await Promise.all([
    listUniversities(),
    listCampuses(),
  ]);

  const campusesBy = new Map<string, Campus[]>();
  for (const campus of campuses) {
    const list = campusesBy.get(campus.university_id) ?? [];
    list.push(campus);
    campusesBy.set(campus.university_id, list);
  }

  return (
    <>
      <h1 className="pt-10 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        Universities
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        {universities.length} universities and{" "}
        {campuses.length} campuses. FAST-NUCES has its full BS Computer Science
        roadmap loaded; at the others, students add the courses they take.
      </p>

      <ul className="sheet mt-8">
        {universities.map((u) => {
          const list = campusesBy.get(u.id) ?? [];
          const facts = [
            u.sector ? `${u.sector === "public" ? "Public" : "Private"}` : null,
            u.city,
            u.founded ? `founded ${u.founded}` : null,
          ].filter(Boolean);
          return (
            <li key={u.id} className="line">
              <span className="in-margin font-display font-bold">
                {u.short_name}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline justify-between gap-x-6">
                  <Link href={`/u/${u.slug}`} className="font-medium hover:underline">
                    {u.name}
                  </Link>
                  <span className="text-sm tabular-nums text-ink-soft">
                    {u.course_count} {u.course_count === 1 ? "course" : "courses"},{" "}
                    {u.resource_count} {u.resource_count === 1 ? "file" : "files"}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-ink-soft">
                  {facts.join(", ")}
                  {list.length > 0 && (
                    <>
                      . {list.length} {list.length === 1 ? "campus" : "campuses"}:{" "}
                      {list.map((c) => c.name).join(", ")}
                    </>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-ink-soft">
        Campus lists come from each university&apos;s website and public
        records. Spot something out of date? Mention it in any course
        discussion.
      </p>
    </>
  );
}
