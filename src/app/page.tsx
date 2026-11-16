import Link from "next/link";
import { RoadmapGrid } from "@/components/Roadmap";
import { DEFAULT_UNIVERSITY } from "@/lib/config";
import { listCourses, listElectiveSlots, listUniversities } from "@/lib/data";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Find your course",
    text: "Every course in the FAST BS Computer Science roadmap, semester by semester.",
  },
  {
    title: "Get the files and answers",
    text: "Download the notes and past papers students voted most useful, ask questions, or ask the notes directly.",
  },
  {
    title: "Add yours after the exam",
    text: "Upload what helped you. A reviewer checks it, then it is there for the next batch.",
  },
];

const TOOLS = [
  {
    label: "Files",
    title: "Notes, past papers and assignments",
    text: "Sorted by course and ranked by upvotes, with every upload reviewed first.",
  },
  {
    label: "Discussion",
    title: "Questions and answers per course",
    text: "Ask about a lecture, an assignment or a past paper and get answers from students who took it.",
  },
  {
    label: "Assistant",
    title: "Ask the notes",
    text: "Get an answer built only from the files uploaded to that course, with links to where it came from.",
  },
  {
    label: "Teams",
    title: "Find teammates",
    text: "Partners for semester projects, hackathons like NaSCon, your final year project or a study group.",
    href: "/teams",
  },
];

export default async function Home() {
  const universities = await listUniversities();
  const fast = universities.find((u) => u.slug === DEFAULT_UNIVERSITY);
  const others = universities.filter((u) => u.slug !== DEFAULT_UNIVERSITY);

  const [courses, slots] = await Promise.all([
    listCourses("", DEFAULT_UNIVERSITY),
    fast ? listElectiveSlots(fast.id) : Promise.resolve([]),
  ]);
  const roadmapCourses = courses.filter(
    (c) => c.program === "BS Computer Science",
  );

  return (
    <>
      <section className="grid gap-10 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
            <span className="hi">FAST notes, past papers and answers,</span>{" "}
            sorted by course.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Built for FAST-NUCES students across all six campuses: find what
            your seniors already wrote, ask about what you are stuck on, and
            leave something for the next batch.
          </p>

          <form
            action={`/u/${DEFAULT_UNIVERSITY}`}
            className="mt-8 flex max-w-xl gap-2"
          >
            <label htmlFor="q" className="sr-only">
              Search FAST-NUCES courses and files
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Course or topic, such as Data Structures or CS2001"
              className="field py-3"
            />
            <button className="btn px-5">Search</button>
          </form>

          <nav
            aria-label="Jump to a semester"
            className="mt-5 flex flex-wrap items-center gap-1.5 text-sm"
          >
            <span className="mr-1 text-ink-soft">Jump to semester</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Link
                key={n}
                href={`/u/${DEFAULT_UNIVERSITY}#semester-${n}`}
                className="grid size-8 place-items-center rounded border border-rule bg-sheet font-semibold tabular-nums hover:border-ink"
              >
                {n}
              </Link>
            ))}
          </nav>
        </div>

        <ol className="sheet">
          {STEPS.map((step, i) => (
            <li key={step.title} className="line">
              <span className="in-margin font-display text-2xl font-extrabold text-margin">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-ink-soft">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pb-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              BS Computer Science, all eight semesters
            </h2>
            <p className="mt-1 text-ink-soft">
              The FAST-NUCES roadmap. Open any course for its files, questions
              and notes assistant.
            </p>
          </div>
          <Link
            href={`/u/${DEFAULT_UNIVERSITY}`}
            className="text-sm font-semibold underline"
          >
            Full course list with credit hours
          </Link>
        </div>
        <RoadmapGrid
          courses={roadmapCourses}
          slots={slots}
          universitySlug={DEFAULT_UNIVERSITY}
        />
      </section>

      <section className="pb-14">
        <h2 className="mb-5 font-display text-2xl font-bold sm:text-3xl">
          On every course page
        </h2>
        <ul className="sheet">
          {TOOLS.map((tool) => (
            <li key={tool.label} className="line">
              <span className="in-margin text-sm font-semibold text-ink-soft">
                {tool.label}
              </span>
              <span>
                <span className="block font-semibold">
                  {tool.href ? (
                    <Link href={tool.href} className="hover:underline">
                      {tool.title}
                    </Link>
                  ) : (
                    tool.title
                  )}
                </span>
                <span className="block text-sm text-ink-soft">{tool.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {others.length > 0 && (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Not at FAST?
              </h2>
              <p className="mt-1 text-ink-soft">
                {others.length} more universities across Pakistan. Students add
                their own courses as they go.
              </p>
            </div>
            <Link
              href="/universities"
              className="text-sm font-semibold underline"
            >
              See all universities and campuses
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {others.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/u/${u.slug}`}
                  className="inline-block rounded border border-rule bg-sheet px-3 py-1.5 text-sm font-medium hover:border-ink"
                >
                  {u.short_name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
