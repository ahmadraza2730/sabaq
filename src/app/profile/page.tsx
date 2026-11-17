import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listCampuses, listMyUploads } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { sectionLabel } from "@/lib/fast";
import { TYPE_LABELS, type Campus, type ResourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your profile" };

const STATUS_TEXT: Record<ResourceStatus, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Not approved",
};

export default async function ProfilePage() {
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
        {[
          session.profile.roll_number,
          sectionLabel(
            session.profile.program,
            session.profile.current_semester,
            session.profile.section,
          ),
          session.email,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
      <p className="mt-2 text-sm">
        <Link href="/onboarding?next=%2Fprofile" className="font-semibold underline">
          {session.profile.roll_number ? "Edit your FAST details" : "Set up your FAST profile"}
        </Link>
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

    </>
  );
}
