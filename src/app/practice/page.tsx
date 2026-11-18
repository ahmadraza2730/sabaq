import type { Metadata } from "next";
import Link from "next/link";
import { listProblems, TRACKS, type Track } from "@/lib/practice";
import { createClient, getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Coding practice",
  description: "PF, OOP and DSA practice problems with a built-in C++ and Java compiler, for FAST-NUCES students.",
};

const LEVEL_TONE: Record<string, string> = {
  Easy: "text-ok",
  Medium: "text-ink",
  Hard: "text-margin",
};

export default async function PracticePage(props: PageProps<"/practice">) {
  const query = await props.searchParams;
  const pick = typeof query.track === "string" ? query.track.toUpperCase() : "";
  const session = await getSession();
  const problems = listProblems();

  let solved = new Set<string>();
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase.from("practice_solved").select("problem_slug");
    solved = new Set((data ?? []).map((r) => r.problem_slug as string));
  }

  const tracks = (Object.keys(TRACKS) as Track[]).filter((t) => !pick || t === pick);
  const solvedCount = problems.filter((p) => solved.has(p.slug)).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Coding practice
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Problems for PF, OOP and DSA in the style of LeetCode. Write C++ or
            Java in the browser, run it on the sample, then submit against the
            hidden tests.
          </p>
        </div>
        <Link href="/compiler" className="btn btn-quiet">
          Open the compiler
        </Link>
      </div>

      {session && (
        <p className="mt-5 text-sm">
          <span className="font-semibold tabular-nums">
            {solvedCount} of {problems.length}
          </span>{" "}
          solved
        </p>
      )}

      <nav aria-label="Course" className="mt-6 flex flex-wrap gap-1.5">
        {["", "PF", "OOP", "DSA"].map((t) => (
          <Link
            key={t || "all"}
            href={t ? `/practice?track=${t}` : "/practice"}
            aria-current={pick === t ? "page" : undefined}
            className={`rounded border px-3 py-1.5 text-sm font-semibold ${
              pick === t ? "border-ink bg-ink text-sheet" : "border-rule bg-sheet hover:border-ink"
            }`}
          >
            {t || "All"}
          </Link>
        ))}
      </nav>

      {tracks.map((track) => {
        const items = problems.filter((p) => p.track === track);
        const done = items.filter((p) => solved.has(p.slug)).length;
        return (
          <section key={track} className="mt-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 className="font-display text-2xl font-bold">
                {TRACKS[track].name}{" "}
                <span className="text-base font-normal text-ink-soft">{TRACKS[track].course}</span>
              </h2>
              <p className="text-sm text-ink-soft">
                {TRACKS[track].blurb}
                {session && ` ${done}/${items.length} solved.`}
              </p>
            </div>
            <ul className="sheet">
              {items.map((p, i) => (
                <li key={p.slug} className="line">
                  <span className="in-margin text-sm tabular-nums text-ink-soft">
                    {solved.has(p.slug) ? (
                      <span className="font-bold text-ok" aria-label="Solved">
                        ✓
                      </span>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
                    <Link href={`/practice/${p.slug}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <span className={`text-sm font-semibold ${LEVEL_TONE[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="mt-10 max-w-2xl text-sm text-ink-soft">
        Problems are written for Sabaq and cover the classic interview and exam
        patterns. Code runs on Compiler Explorer (godbolt.org) with its time and
        memory limits.
      </p>
    </>
  );
}
