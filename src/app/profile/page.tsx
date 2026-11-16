import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { listCampuses, listMyUploads } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { TYPE_LABELS, type Campus, type ResourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your profile" };

const STATUS_TEXT: Record<ResourceStatus, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Not approved",
};

export default async function ProfilePage({
  searchParams,
}: PageProps<"/profile">) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  const [uploads, campuses] = await Promise.all([
    listMyUploads(session.userId),
    listCampuses(),
  ]);
  const approved = uploads.filter((u) => u.status === "approved");
  const downloads = approved.reduce((sum, u) => sum + u.downloads, 0);
  const upvotes = approved.reduce((sum, u) => sum + u.votes, 0);

  const byUniversity = new Map<string, Campus[]>();
  for (const campus of campuses) {
    const list = byUniversity.get(campus.university_short_name) ?? [];
    list.push(campus);
    byUniversity.set(campus.university_short_name, list);
  }

  return (
    <>
      <h1 className="pt-8 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {session.profile.full_name || "Your profile"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {session.email}
        {session.profile.batch ? `, batch ${session.profile.batch}` : ""}
      </p>

      <p className="mt-6 text-lg">
        Your {approved.length} approved{" "}
        {approved.length === 1 ? "file has" : "files have"} been downloaded{" "}
        <strong>{downloads}</strong> {downloads === 1 ? "time" : "times"} and
        upvoted <strong>{upvotes}</strong> {upvotes === 1 ? "time" : "times"}.
      </p>

      <h2 className="mb-3 mt-10 font-display text-xl font-bold">Your uploads</h2>
      <ul className="sheet">
        {uploads.length === 0 && (
          <li className="line">
            <span className="in-margin" />
            <span>
              You have not uploaded anything yet.{" "}
              <Link href="/upload" className="font-semibold underline">
                Upload a file
              </Link>
              .
            </span>
          </li>
        )}
        {uploads.map((upload) => (
          <li key={upload.id} className="line">
            <span className="in-margin text-sm font-semibold tabular-nums text-ink-soft">
              {upload.course_code}
            </span>
            <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span>
                <a href={`/r/${upload.id}`} className="font-medium underline">
                  {upload.title}
                </a>
                <span className="block text-sm text-ink-soft">
                  {TYPE_LABELS[upload.type]}
                  {upload.year ? `, ${upload.year}` : ""}
                </span>
              </span>
              <span
                className={`text-sm font-semibold ${
                  upload.status === "approved"
                    ? "text-ok"
                    : upload.status === "rejected"
                      ? "text-margin"
                      : "text-ink-soft"
                }`}
              >
                {STATUS_TEXT[upload.status]}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-12 max-w-xl">
        <h2 className="font-display text-xl font-bold">Your details</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your campus decides which university the site opens on for you.
        </p>
        <ErrorNote message={one(query.error)} />
        {one(query.saved) && (
          <p role="status" className="my-4 rounded bg-hi p-3 text-sm font-medium">
            Saved.
          </p>
        )}
        <form action={updateProfile} className="mt-3 grid gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Full name
            <input
              name="full_name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={session.profile.full_name}
              className="field"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Batch
              <input
                name="batch"
                maxLength={20}
                defaultValue={session.profile.batch ?? ""}
                placeholder="Such as 2025"
                className="field"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Campus
              <select
                name="campus_id"
                defaultValue={session.profile.campus_id ?? ""}
                className="field"
              >
                <option value="">Not set</option>
                {[...byUniversity.entries()].map(([name, list]) => (
                  <optgroup key={name} label={name}>
                    {list.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {name} {campus.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          <div>
            <button className="btn">Save details</button>
          </div>
        </form>
      </section>
    </>
  );
}
