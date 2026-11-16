import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCourse } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { ResourceLine } from "@/components/ResourceLine";
import { RoadmapTable, semestersIn } from "@/components/Roadmap";
import {
  getUniversity,
  listCampuses,
  listCourses,
  listElectiveSlots,
  listMyVotes,
  searchResources,
} from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

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

  const [courses, files, slots, campuses, session] = await Promise.all([
    listCourses(q, university.slug),
    searchResources(q, university.slug),
    q ? Promise.resolve([]) : listElectiveSlots(university.id),
    listCampuses(),
    getSession(),
  ]);
  const myVotes = session ? await listMyVotes(session.userId) : new Set<string>();
  const ourCampuses = campuses.filter((c) => c.university_id === university.id);
  const programs = [...new Set(courses.map((c) => c.program).filter(Boolean))];
  const semesters = semestersIn(courses, slots);

  const facts = [
    university.sector === "public"
      ? "Public university"
      : university.sector === "private"
        ? "Private university"
        : null,
    university.city ? `based in ${university.city}` : null,
    university.founded ? `founded ${university.founded}` : null,
  ].filter(Boolean);

  return (
    <>
      <p className="pt-8 text-sm text-ink-soft">
        <Link href="/universities" className="underline">
          Universities
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {university.short_name}
          </h1>
          <p className="mt-1 text-lg text-ink-soft">{university.name}</p>
        </div>
        {university.website && (
          <a
            href={university.website}
            className="text-sm font-semibold underline"
            rel="noopener noreferrer"
          >
            Official website
          </a>
        )}
      </div>

      {(facts.length > 0 || ourCampuses.length > 0) && (
        <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {facts.length > 0 && (
            <>
              <dt className="font-semibold">About</dt>
              <dd className="text-ink-soft">{facts.join(", ")}.</dd>
            </>
          )}
          {ourCampuses.length > 0 && (
            <>
              <dt className="font-semibold">
                {ourCampuses.length} {ourCampuses.length === 1 ? "campus" : "campuses"}
              </dt>
              <dd className="text-ink-soft">
                {ourCampuses.map((c) => c.name).join(", ")}
              </dd>
            </>
          )}
          {programs.length > 0 && (
            <>
              <dt className="font-semibold">Roadmap</dt>
              <dd className="text-ink-soft">{programs.join(", ")}</dd>
            </>
          )}
        </dl>
      )}

      <form action={path} className="mb-6 mt-8 flex max-w-xl gap-2">
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

      {!q && semesters.length > 1 && (
        <nav
          aria-label="Semesters"
          className="z-30 sm:sticky sm:top-[57px] -mx-4 mb-8 flex flex-wrap items-center gap-1.5 border-b border-rule bg-paper/95 px-4 py-2.5 text-sm backdrop-blur"
        >
          <span className="mr-1 text-ink-soft">Semester</span>
          {semesters.map((n) => (
            <a
              key={n}
              href={`#semester-${n}`}
              className="grid size-8 place-items-center rounded border border-rule bg-sheet font-semibold tabular-nums hover:border-ink"
            >
              {n}
            </a>
          ))}
        </nav>
      )}

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

      {courses.length === 0 && slots.length === 0 ? (
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
      ) : (
        <>
          {q && <h2 className="mb-3 font-display text-xl font-bold">Courses</h2>}
          <RoadmapTable
            courses={courses}
            slots={slots}
            universitySlug={university.slug}
          />
        </>
      )}

      <section id="add-course" className="mt-12 max-w-xl scroll-mt-24">
        <h2 className="font-display text-xl font-bold">Course missing?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Add electives and any course not listed, using the code from your
          transcript or course outline.
        </p>
        {session ? (
          <form action={addCourse.bind(null, university.slug)} className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <label className="grid gap-1 text-sm font-medium">
                Code
                <input
                  name="code"
                  required
                  maxLength={12}
                  placeholder="CS4063"
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
                  placeholder="Natural Language Processing"
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
          <p className="mt-3 text-sm">
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
