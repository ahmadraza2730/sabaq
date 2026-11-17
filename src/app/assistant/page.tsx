import type { Metadata } from "next";
import Link from "next/link";
import { AskForm } from "@/components/AskForm";
import { AI_DAILY_LIMIT, isAssistantEnabled } from "@/lib/ai";
import { DEFAULT_UNIVERSITY } from "@/lib/config";
import { listCourses } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAST study assistant" };

const EXAMPLES = [
  "Explain the difference between a min-heap and a BST, with an example.",
  "How does a virtual function table work in C++?",
  "Walk me through converting a DFA to a regular expression.",
  "Kya difference hai process aur thread mein?",
];

export default async function AssistantPage() {
  const [session, courses] = await Promise.all([
    getSession(),
    listCourses("", DEFAULT_UNIVERSITY),
  ]);
  const enabled = isAssistantEnabled();

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        FAST study assistant
      </h1>
      <p className="mt-3 text-lg text-ink-soft">
        Ask about any FAST-NUCES course. It looks through the notes and papers
        students have uploaded first and cites them; when nothing matches, it
        explains from general knowledge and tells you so.
      </p>

      <ul className="mt-5 grid gap-1.5 text-sm text-ink-soft">
        <li>Pick a course to search only its notes, or ask across all courses.</li>
        <li>Write in English or Roman Urdu.</li>
        <li>{AI_DAILY_LIMIT} questions a day per student.</li>
      </ul>

      {!enabled ? (
        <p className="mt-8 rounded bg-hi p-3 text-sm font-medium">
          The study assistant is not switched on yet.
        </p>
      ) : !session ? (
        <div className="sheet sheet-tight mt-8 p-6 pl-7">
          <p className="font-semibold">Sign in to ask questions</p>
          <p className="mt-1 text-sm text-ink-soft">
            Accounts keep the assistant free for everyone by limiting daily use.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login?next=%2Fassistant" className="btn">
              Sign in
            </Link>
            <Link href="/login?mode=signup&next=%2Fassistant" className="btn btn-quiet">
              Create an account
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-soft">Questions students ask:</p>
          <ul className="mt-1 grid gap-1 text-sm">
            {EXAMPLES.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      ) : (
        <AskForm
          courses={courses.map((c) => ({ id: c.id, label: `${c.code} ${c.title}` }))}
          placeholder={EXAMPLES[0]}
        />
      )}
    </div>
  );
}
