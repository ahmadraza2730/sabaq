import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeRunner } from "@/components/CodeRunner";
import { getProblem, TRACKS } from "@/lib/practice";
import { createClient, getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/practice/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const problem = getProblem(slug);
  return { title: problem ? `${problem.title} (practice)` : "Practice problem" };
}

export default async function ProblemPage(props: PageProps<"/practice/[slug]">) {
  const { slug } = await props.params;
  const problem = getProblem(slug);
  if (!problem) notFound();
  const session = await getSession();

  let solvedIn: string | null = null;
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("practice_solved")
      .select("language")
      .eq("problem_slug", slug)
      .maybeSingle();
    solvedIn = (data?.language as string | undefined) ?? null;
  }

  const track = TRACKS[problem.track];

  return (
    <div className="pt-8">
      <p className="text-sm text-ink-soft">
        <Link href="/practice" className="underline">
          Practice
        </Link>{" "}
        /{" "}
        <Link href={`/practice?track=${problem.track}`} className="underline">
          {track.name}
        </Link>
      </p>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <article className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            {problem.title}
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
            <span className="font-semibold">{problem.difficulty}</span>
            <span className="text-ink-soft">{track.course}</span>
            {solvedIn && (
              <span className="font-semibold text-ok">
                Solved in {solvedIn === "cpp" ? "C++" : "Java"}
              </span>
            )}
          </p>

          <p className="mt-5 leading-relaxed">{problem.statement}</p>

          <h2 className="mt-6 font-display text-lg font-bold">Input</h2>
          <p className="mt-1 leading-relaxed">{problem.input}</p>

          <h2 className="mt-5 font-display text-lg font-bold">Output</h2>
          <p className="mt-1 leading-relaxed">{problem.output}</p>

          <h2 className="mt-5 font-display text-lg font-bold">Limits</h2>
          <ul className="mt-1 grid list-disc gap-1 pl-5">
            {problem.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold">Sample input</h2>
              <pre className="mt-1 max-h-60 overflow-auto rounded border border-rule bg-sheet p-3 font-mono text-sm">
                {problem.sample.input}
              </pre>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold">Sample output</h2>
              <pre className="mt-1 max-h-60 overflow-auto rounded border border-rule bg-sheet p-3 font-mono text-sm">
                {problem.sample.output}
              </pre>
            </div>
          </div>

          {problem.hint && (
            <details className="mt-6">
              <summary className="cursor-pointer font-semibold">Show a hint</summary>
              <p className="mt-2 leading-relaxed text-ink-soft">{problem.hint}</p>
            </details>
          )}
        </article>

        <div className="min-w-0">
          <CodeRunner
            storageKey={problem.slug}
            starter={problem.starter}
            problem={problem.slug}
            sampleInput={problem.sample.input}
            signedIn={Boolean(session)}
            nextPath={`/practice/${problem.slug}`}
          />
        </div>
      </div>
    </div>
  );
}
