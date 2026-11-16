import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { reviewResource } from "@/app/actions";
import { listPending } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review queue" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") notFound();

  const pending = await listPending();

  return (
    <>
      <h1 className="pt-8 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Review queue
      </h1>
      <p className="mt-2 text-ink-soft">
        Open each file before approving it. Approved files appear on the course
        page straight away.
      </p>

      <ul className="sheet mt-8">
        {pending.length === 0 && (
          <li className="line">
            <span className="in-margin" />
            <span>Nothing is waiting for review.</span>
          </li>
        )}
        {pending.map((resource) => (
          <li key={resource.id} className="line">
            <span className="in-margin text-sm font-semibold tabular-nums text-ink-soft">
              {resource.course_code}
            </span>
            <span className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <span>
                <a href={`/r/${resource.id}`} className="font-medium underline">
                  {resource.title}
                </a>
                <span className="block text-sm text-ink-soft">
                  {TYPE_LABELS[resource.type]}
                  {resource.year ? `, ${resource.year}` : ""}, from{" "}
                  {resource.uploader_name || "a student"}, {resource.file_name}
                </span>
              </span>
              <span className="flex gap-2">
                <form action={reviewResource.bind(null, resource.id, "approved")}>
                  <button className="btn">Approve</button>
                </form>
                <form action={reviewResource.bind(null, resource.id, "rejected")}>
                  <button className="btn btn-quiet">Reject</button>
                </form>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
