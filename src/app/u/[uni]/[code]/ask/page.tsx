import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskForm } from "@/components/AskForm";
import { AI_DAILY_LIMIT, isAssistantEnabled } from "@/lib/ai";
import { countIndexed, getCourse } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

type Props = PageProps<"/u/[uni]/[code]/ask">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  return { title: course ? `Ask the ${course.code} notes` : "Ask the notes" };
}

export default async function AskPage({ params }: Props) {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  if (!course) notFound();

  const [session, indexed] = await Promise.all([
    getSession(),
    countIndexed(course.id),
  ]);
  const enabled = isAssistantEnabled();
  const askPath = `/u/${course.university_slug}/${course.code}/ask`;

  return (
    <div className="max-w-2xl">
      <p className="text-ink-soft">
        Ask about {course.code}. Answers come from the notes and papers
        students uploaded for this course, with links to the files used. When
        nothing matches, you get a general explanation, clearly marked.
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        {indexed === 0
          ? "No files in this course have been read yet."
          : `${indexed} ${indexed === 1 ? "file" : "files"} in this course can be searched.`}{" "}
        You can ask {AI_DAILY_LIMIT} questions a day.
      </p>

      {!enabled ? (
        <p className="mt-6 rounded bg-hi p-3 text-sm font-medium">
          The study assistant is not switched on yet.
        </p>
      ) : !session ? (
        <p className="mt-6 text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(askPath)}`}
            className="font-semibold underline"
          >
            Sign in
          </Link>{" "}
          to ask the notes.
        </p>
      ) : (
        <AskForm
          courseId={course.id}
          placeholder={`Ask anything about ${course.code} ${course.title}`}
        />
      )}
    </div>
  );
}
