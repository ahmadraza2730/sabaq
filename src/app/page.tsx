import Link from "next/link";
import { ResourceLine } from "@/components/ResourceLine";
import { listCourses, listMyVotes, searchResources } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const [courses, files, session] = await Promise.all([
    listCourses(q),
    searchResources(q),
    getSession(),
  ]);
  const myVotes = session ? await listMyVotes(session.userId) : new Set<string>();

  const bySemester = new Map<number, Course[]>();
  for (const course of courses) {
    const list = bySemester.get(course.semester) ?? [];
    list.push(course);
    bySemester.set(course.semester, list);
  }

  return (
    <>
      <section className="pb-10 pt-6 sm:pt-12">
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          <span className="hi">The notes your seniors already wrote.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Notes, past papers and assignments from FAST-NUCES students, sorted
          by course. Find what you need before the exam, then add your own.
        </p>

        <form action="/" className="mt-8 flex max-w-xl gap-2">
          <label htmlFor="q" className="sr-only">
            Search courses and files
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Course name, code or topic, such as CS2001"
            className="field"
          />
          <button className="btn">Search</button>
        </form>
      </section>

      {q && (
        <p className="mb-6 text-sm">
          Results for <strong>{q}</strong>.{" "}
          <Link href="/" className="underline">
            Show all courses
          </Link>
        </p>
      )}

      {q && files.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-bold">Files</h2>
          <ul className="sheet">
            {files.map((file) => (
              <ResourceLine
                key={file.id}
                resource={file}
                voted={myVotes.has(file.id)}
                path="/"
                showCourse
              />
            ))}
          </ul>
        </section>
      )}

      {courses.length === 0 && files.length === 0 && (
        <div className="sheet">
          <p className="line">
            <span className="in-margin" />
            <span>
              Nothing matches <strong>{q}</strong>. Try the course code, or a
              shorter word from the title.
            </span>
          </p>
        </div>
      )}

      {[...bySemester.entries()].map(([semester, list]) => (
        <section key={semester} className="mb-10">
          <h2 className="mb-3 font-display text-xl font-bold">
            Semester {semester}
          </h2>
          <ul className="sheet">
            {list.map((course) => (
              <li key={course.id} className="line">
                <span className="in-margin text-sm font-semibold tabular-nums text-ink-soft">
                  {course.code}
                </span>
                <span className="flex flex-wrap items-baseline justify-between gap-x-6">
                  <Link
                    href={`/u/${course.university_slug}/${course.code}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                  <span className="text-sm text-ink-soft">
                    {course.resource_count === 0
                      ? "No files yet"
                      : `${course.resource_count} ${
                          course.resource_count === 1 ? "file" : "files"
                        }`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
