import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCourse } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { ResourceLine } from "@/components/ResourceLine";
import {
  getUniversity,
  listCourses,
  listMyVotes,
  searchResources,
} from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

type Props = PageProps<"/u/[uni]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni } = await params;
  const university = await getUniversity(uni);
  return { title: university ? `${university.short_name} courses` : "Courses" };
}

export default async function UniversityPage({ params, searchParams }: Props) {
  const [{ uni }, query] = await Promise.all([params, searchParams]);
  const university = await getUniversity(uni);
  if (!university) notFound();

  const q = one(query.q).trim();
  const path = `/u/${university.slug}`;

  const [courses, files, session] = await Promise.all([
    listCourses(q, university.slug),
    searchResources(q, university.slug),
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
      <p className="pt-4 text-sm text-ink-soft">
        <Link href="/" className="underline">
          Universities
        </Link>
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {university.short_name}
      </h1>
      <p className="mt-2 text-ink-soft">{university.name}</p>

      <form action={path} className="mb-8 mt-6 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search {university.short_name} courses and files
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Course name, code or topic"
          className="field"
        />
        <button className="btn">Search</button>
      </form>

      <ErrorNote message={one(query.error)} />

      {q && (
        <p className="mb-6 text-sm">
          Results for <strong>{q}</strong>.{" "}
          <Link href={path} className="underline">
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
                path={`${path}?q=${encodeURIComponent(q)}`}
                showCourse
              />
            ))}
          </ul>
        </section>
      )}

      {courses.length === 0 && (
        <div className="sheet mb-10">
          <p className="line">
            <span className="in-margin" />
            <span>
              {q
                ? `No course matches ${q}. Try the course code, or a shorter word from the title.`
                : `No ${university.short_name} courses are listed yet. Add the ones you take below.`}
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
                    href={`${path}/${course.code}`}
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

      <section className="mt-12 max-w-xl">
        <h2 className="font-display text-xl font-bold">Course missing?</h2>
        {session ? (
          <form action={addCourse.bind(null, university.slug)} className="mt-3 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <label className="grid gap-1 text-sm font-medium">
                Code
                <input
                  name="code"
                  required
                  maxLength={12}
                  placeholder="CS2001"
                  className="field uppercase"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Data Structures"
                  className="field"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium sm:max-w-[12rem]">
              Usual semester
              <select name="semester" required defaultValue="" className="field">
                <option value="" disabled>
                  Choose
                </option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button className="btn">Add course</button>
            </div>
          </form>
        ) : (
          <p className="mt-2 text-sm">
            <Link
              href={`/login?next=${encodeURIComponent(path)}`}
              className="font-semibold underline"
            >
              Sign in
            </Link>{" "}
            to add a course to {university.short_name}.
          </p>
        )}
      </section>
    </>
  );
}
