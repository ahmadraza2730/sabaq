import Link from "next/link";
import { listUniversities } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [universities, session] = await Promise.all([
    listUniversities(),
    getSession(),
  ]);

  // The student's own university first, then the rest by name.
  const mine = session?.universitySlug;
  const ordered = [...universities].sort((a, b) =>
    a.slug === mine ? -1 : b.slug === mine ? 1 : 0,
  );

  return (
    <>
      <section className="pb-10 pt-6 sm:pt-12">
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          <span className="hi">The notes your seniors already wrote.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Notes, past papers and answers shared by university students, sorted
          by course. Find what you need before the exam, ask the notes a
          question, then add your own.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-bold">
          Pick your university
        </h2>
        <ul className="sheet">
          {ordered.map((university) => (
            <li key={university.id} className="line">
              <span className="in-margin text-sm font-semibold text-ink-soft">
                {university.slug === mine ? "Yours" : ""}
              </span>
              <span className="flex flex-wrap items-baseline justify-between gap-x-6">
                <Link
                  href={`/u/${university.slug}`}
                  className="font-medium hover:underline"
                >
                  <span className="font-display text-lg font-bold">
                    {university.short_name}
                  </span>{" "}
                  <span className="text-ink-soft">{university.name}</span>
                </Link>
                <span className="text-sm text-ink-soft">
                  {university.course_count}{" "}
                  {university.course_count === 1 ? "course" : "courses"},{" "}
                  {university.resource_count}{" "}
                  {university.resource_count === 1 ? "file" : "files"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-xl">
        <h2 className="font-display text-xl font-bold">
          Looking for teammates?
        </h2>
        <p className="mt-2 text-ink-soft">
          Find partners for a semester project, a hackathon, your final year
          project or a study group.{" "}
          <Link href="/teams" className="font-semibold text-ink underline">
            Open the team finder
          </Link>
        </p>
      </section>
    </>
  );
}
