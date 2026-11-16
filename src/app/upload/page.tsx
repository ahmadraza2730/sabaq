import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { one } from "@/components/ErrorNote";
import { UploadForm } from "@/components/UploadForm";
import { DEFAULT_UNIVERSITY, isConfigured } from "@/lib/config";
import { getCourseById, listCourses, listUniversities } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Upload a file" };

export default async function UploadPage({
  searchParams,
}: PageProps<"/upload">) {
  const params = await searchParams;
  const preselected = one(params.course);

  const session = await getSession();
  if (isConfigured && !session) {
    const next = preselected ? `/upload?course=${preselected}` : "/upload";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  // Which university's courses to list: the chosen course's, the one in
  // the link, the student's own, then the default.
  const course = preselected ? await getCourseById(preselected) : null;
  const universities = await listUniversities();
  const uniSlug =
    course?.university_slug ||
    universities.find((u) => u.slug === one(params.uni))?.slug ||
    session?.universitySlug ||
    DEFAULT_UNIVERSITY;
  const courses = await listCourses("", uniSlug);

  return (
    <div className="mx-auto max-w-xl pt-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Upload a file
      </h1>
      <p className="mt-2 text-ink-soft">
        Share your own notes, or papers and assignments your teachers allow to
        be shared. A reviewer checks each file before it appears on the course
        page.
      </p>

      <nav aria-label="University" className="mt-6 flex flex-wrap gap-1 text-sm">
        {universities.map((u) => (
          <Link
            key={u.id}
            href={`/upload?uni=${u.slug}`}
            aria-current={u.slug === uniSlug ? "page" : undefined}
            className={`rounded px-2.5 py-1 font-medium ${
              u.slug === uniSlug ? "bg-ink text-sheet" : "hover:bg-sheet"
            }`}
          >
            {u.short_name}
          </Link>
        ))}
      </nav>

      {session ? (
        courses.length > 0 ? (
          <UploadForm
            key={uniSlug}
            userId={session.userId}
            preselected={course?.id ?? ""}
            courses={courses.map((c) => ({
              id: c.id,
              label: `${c.code} ${c.title}`,
            }))}
          />
        ) : (
          <p className="mt-6 text-sm">
            This university has no courses listed yet.{" "}
            <Link href={`/u/${uniSlug}`} className="font-semibold underline">
              Add your course first
            </Link>
            .
          </p>
        )
      ) : (
        <p className="mt-6 rounded bg-hi p-3 text-sm font-medium">
          Uploads turn on once the database is connected.
        </p>
      )}
    </div>
  );
}
