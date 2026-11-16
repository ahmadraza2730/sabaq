import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createThread } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { getCourse, listThreads } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { formatDate } from "@/lib/types";

type Props = PageProps<"/u/[uni]/[code]/discuss">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  return { title: course ? `${course.code} discussion` : "Discussion" };
}

export default async function DiscussPage({ params, searchParams }: Props) {
  const [{ uni, code }, query] = await Promise.all([params, searchParams]);
  const course = await getCourse(uni, code);
  if (!course) notFound();

  const [threads, session] = await Promise.all([
    listThreads(course.id),
    getSession(),
  ]);
  const coursePath = `/u/${course.university_slug}/${course.code}`;
  const listPath = `${coursePath}/discuss`;

  return (
    <>
      <ErrorNote message={one(query.error)} />

      {session ? (
        <details className="sheet mb-6" open={threads.length === 0}>
          <summary className="cursor-pointer py-3 pl-8 pr-4 font-semibold sm:pl-[7.25rem]">
            Ask a question
          </summary>
          <form
            action={createThread.bind(null, course.id, coursePath)}
            className="grid gap-4 pb-5 pl-8 pr-4 sm:pl-[7.25rem] sm:pr-6"
          >
            <label className="grid gap-1 text-sm font-medium">
              Question
              <input
                name="title"
                required
                minLength={5}
                maxLength={150}
                placeholder="Such as: Why is heap insertion O(log n)?"
                className="field"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Details
              <textarea
                name="body"
                required
                maxLength={5000}
                rows={4}
                placeholder="What you tried, where you got stuck, which lecture or assignment it is from."
                className="field"
              />
            </label>
            <div>
              <button className="btn">Post question</button>
            </div>
          </form>
        </details>
      ) : (
        <p className="mb-6 text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(listPath)}`}
            className="font-semibold underline"
          >
            Sign in
          </Link>{" "}
          to ask or answer a question.
        </p>
      )}

      <ul className="sheet">
        {threads.length === 0 && (
          <li className="line">
            <span className="in-margin" />
            <span>No questions about {course.code} yet. Ask the first one.</span>
          </li>
        )}
        {threads.map((thread) => (
          <li key={thread.id} className="line">
            <span className="in-margin text-sm font-semibold tabular-nums text-ink-soft">
              {thread.reply_count}{" "}
              {thread.reply_count === 1 ? "answer" : "answers"}
            </span>
            <span>
              <Link
                href={`${listPath}/${thread.id}`}
                className="font-medium hover:underline"
              >
                {thread.title}
              </Link>
              <span className="block text-sm text-ink-soft">
                Asked by {thread.author_name || "a student"},{" "}
                {formatDate(thread.created_at)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
