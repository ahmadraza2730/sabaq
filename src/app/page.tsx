import Link from "next/link";
import { HeroArt } from "@/components/HeroArt";
import { Reveal } from "@/components/Reveal";
import { Scramble } from "@/components/Scramble";
import { RoadmapGrid } from "@/components/Roadmap";
import { WordCycle } from "@/components/WordCycle";
import { DEFAULT_UNIVERSITY } from "@/lib/config";
import {
  countDueSoon,
  listElectiveSlots,
  listProgramRoadmap,
  listUniversities,
} from "@/lib/data";
import { PROGRAMS, PROGRAM_CODES, isProgram, sectionLabel } from "@/lib/fast";
import { getSession } from "@/lib/supabase/server";

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
    label: "Practice",
    title: "Coding practice with a built-in compiler",
    text: "PF, OOP and DSA problems in the style of LeetCode. Write C++ or Java in the browser, run it, and submit against hidden tests.",
    href: "/practice",
  },
  {
    label: "Assistant",
    title: "FAST study assistant",
    text: "Ask about any course in English or Roman Urdu. It cites the uploaded notes when they cover it and explains from general knowledge when they do not.",
    href: "/assistant",
  },
  {
    label: "My work",
    title: "Assignments and reminders",
    text: "Connect Google Classroom to pull in what is due and what you have not turned in, get due dates in Google Calendar, or add your own reminders.",
    href: "/tasks",
  },
  {
    label: "Teams",
    title: "Find teammates",
    text: "Partners for semester projects, hackathons like NaSCon, your final year project or a study group.",
    href: "/teams",
  },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = await searchParams;
  const [universities, session] = await Promise.all([listUniversities(), getSession()]);
  const fast = universities.find((u) => u.slug === DEFAULT_UNIVERSITY);
  const program = isProgram(query.program)
    ? query.program
    : isProgram(session?.profile.program)
      ? session.profile.program
      : "CS";

  const [roadmapCourses, slots, dueSoon] = await Promise.all([
    listProgramRoadmap(program),
    fast ? listElectiveSlots(fast.id, program) : Promise.resolve([]),
    session ? countDueSoon(session.userId) : Promise.resolve(0),
  ]);
  const profile = session?.profile;
  const section = profile
    ? sectionLabel(profile.program, profile.current_semester, profile.section)
    : null;

  return (
    <>
      {session && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded border border-rule bg-sheet px-4 py-3 text-sm">
          <span>
            {profile?.roll_number ? (
              <>
                <span className="font-semibold">{profile.full_name}</span>{" "}
                <span className="text-ink-soft">
                  {[profile.roll_number, section].filter(Boolean).join(", ")}
                </span>
              </>
            ) : (
              <>
                <Link href="/onboarding" className="font-semibold underline">
                  Set up your FAST profile
                </Link>{" "}
                <span className="text-ink-soft">with your roll number, program and section.</span>
              </>
            )}
          </span>
          <Link href="/tasks" className={dueSoon > 0 ? "font-semibold text-margin underline" : "underline"}>
            {dueSoon > 0
              ? `${dueSoon} ${dueSoon === 1 ? "task" : "tasks"} due soon`
              : "My work"}
          </Link>
        </div>
      )}

      <section className="grid gap-10 pb-10 pt-10 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
            FAST{" "}
            <span className="hi">
              <WordCycle words={["notes", "past papers", "slides", "lab tasks", "answers"]} />
            </span>
            <Scramble text=", sorted by course." delay={200} className="ink-gradient" />
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Built for FAST-NUCES students in BS CS, SE, AI, DS and Cyber
            Security, across all six campuses: find what your seniors already
            wrote, keep track of what is due, and ask the study assistant when
            you are stuck.
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
                href={`/u/${DEFAULT_UNIVERSITY}?program=${program}#semester-${n}`}
                className="grid size-8 place-items-center rounded border border-rule bg-sheet font-semibold tabular-nums hover:border-ink"
              >
                {n}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <HeroArt />
        </div>
      </section>

      <Reveal as="ol" className="grid gap-3 pb-14 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="lift sheet sheet-tight p-5 pl-7">
            <span className="font-display text-3xl font-extrabold text-margin">{i + 1}</span>
            <span className="mt-1 block font-semibold">{step.title}</span>
            <span className="mt-1 block text-sm text-ink-soft">{step.text}</span>
          </li>
        ))}
      </Reveal>

      <section className="pb-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {PROGRAMS[program]}, all eight semesters
            </h2>
            <p className="mt-1 text-ink-soft">
              The FAST-NUCES roadmap. Open any course for its files, questions
              and study assistant.
            </p>
          </div>
          <Link
            href={`/u/${DEFAULT_UNIVERSITY}?program=${program}`}
            className="text-sm font-semibold underline"
          >
            Full course list with credit hours
          </Link>
        </div>
        <nav aria-label="Degree program" className="mb-5 flex flex-wrap gap-1.5">
          {PROGRAM_CODES.map((code) => (
            <Link
              key={code}
              href={`/?program=${code}`}
              scroll={false}
              aria-current={code === program ? "page" : undefined}
              title={PROGRAMS[code]}
              className={`rounded border px-3 py-1.5 text-sm font-semibold ${
                code === program
                  ? "border-ink bg-ink text-sheet"
                  : "border-rule bg-sheet hover:border-ink"
              }`}
            >
              BS {code}
            </Link>
          ))}
        </nav>
        <Reveal>
          <RoadmapGrid
            courses={roadmapCourses}
            slots={slots}
            universitySlug={DEFAULT_UNIVERSITY}
          />
        </Reveal>
      </section>

      <section className="pb-14">
        <h2 className="mb-5 font-display text-2xl font-bold sm:text-3xl">
          Everything a FAST semester needs
        </h2>
        <Reveal as="ul" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.label} className="lift sheet sheet-tight relative p-5 pl-7 hover:border-ink">
              <span className="text-xs font-bold text-margin">{tool.label}</span>
              <span className="mt-1 block font-display text-lg font-bold leading-snug">
                {tool.href ? (
                  <Link href={tool.href} className="after:absolute after:inset-0 after:content-['']">
                    {tool.title}
                  </Link>
                ) : (
                  tool.title
                )}
              </span>
              <span className="mt-1 block text-sm text-ink-soft">{tool.text}</span>
            </li>
          ))}
        </Reveal>
      </section>

    </>
  );
}
