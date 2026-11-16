import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/UploadForm";
import { isConfigured } from "@/lib/config";
import { listCourses } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Upload a file" };

export default async function UploadPage({
  searchParams,
}: PageProps<"/upload">) {
  const params = await searchParams;
  const preselected = typeof params.course === "string" ? params.course : "";

  const session = await getSession();
  if (isConfigured && !session) {
    const next = preselected ? `/upload?course=${preselected}` : "/upload";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const courses = await listCourses();

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

      {session ? (
        <UploadForm
          userId={session.userId}
          preselected={preselected}
          courses={courses.map((c) => ({
            id: c.id,
            label: `${c.code} ${c.title}`,
          }))}
        />
      ) : (
        <p className="mt-6 rounded bg-hi p-3 text-sm font-medium">
          Uploads turn on once the database is connected.
        </p>
      )}
    </div>
  );
}
