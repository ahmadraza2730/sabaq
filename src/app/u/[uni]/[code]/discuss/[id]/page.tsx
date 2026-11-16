import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createReply, deleteReply, deleteThread } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { getCourse, getThread, listReplies } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { formatDate } from "@/lib/types";

type Props = PageProps<"/u/[uni]/[code]/discuss/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id);
  return { title: thread?.title ?? "Question" };
}

export default async function ThreadPage({ params, searchParams }: Props) {
  const [{ uni, code, id }, query] = await Promise.all([params, searchParams]);
  const [course, thread] = await Promise.all([getCourse(uni, code), getThread(id)]);
  if (!course || !thread || thread.course_id !== course.id) notFound();

  const [replies, session] = await Promise.all([listReplies(thread.id), getSession()]);
  const listPath = `/u/${course.university_slug}/${course.code}/discuss`;
  const threadPath = `${listPath}/${thread.id}`;
  const isAdmin = session?.profile.role === "admin";
  const canDelete = (authorId: string) =>
    Boolean(session && (session.userId === authorId || isAdmin));

  return (
    <>
      <p className="text-sm">
        <Link href={listPath} className="underline">
          All questions
        </Link>
      </p>

      <article className="mt-4">
        <h2 className="font-display text-2xl font-bold">{thread.title}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Asked by {thread.author_name || "a student"},{" "}
          {formatDate(thread.created_at)}
        </p>
        <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed">
          {thread.body}
        </p>
        {canDelete(thread.author_id) && (
          <form action={deleteThread.bind(null, thread.id, listPath)} className="mt-3">
            <button className="cursor-pointer text-sm text-ink-soft underline">
              Delete question
            </button>
          </form>
        )}
      </article>

      <h3 id="answers" className="mb-3 mt-10 font-display text-xl font-bold">
        {replies.length} {replies.length === 1 ? "answer" : "answers"}
      </h3>
      {replies.length > 0 && (
        <ul className="sheet">
          {replies.map((reply) => (
            <li key={reply.id} className="line">
              <span className="in-margin text-sm text-ink-soft">
                {formatDate(reply.created_at)}
              </span>
              <span>
                <span className="block whitespace-pre-line leading-relaxed">
                  {reply.body}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
                  <span>{reply.author_name || "A student"}</span>
                  {canDelete(reply.author_id) && (
                    <form action={deleteReply.bind(null, reply.id, threadPath)}>
                      <button className="cursor-pointer underline">Delete</button>
                    </form>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <ErrorNote message={one(query.error)} />

      {session ? (
        <form
          action={createReply.bind(null, thread.id, threadPath)}
          className="mt-6 grid max-w-2xl gap-3"
        >
          <label className="grid gap-1 text-sm font-medium">
            Your answer
            <textarea
              name="body"
              required
              maxLength={5000}
              rows={5}
              className="field"
            />
          </label>
          <div>
            <button className="btn">Post answer</button>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(threadPath)}`}
            className="font-semibold underline"
          >
            Sign in
          </Link>{" "}
          to answer.
        </p>
      )}
    </>
  );
}
