import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClassroomFileList,
  type FileFilter,
  FileFilterTabs,
  isLectureFile,
} from "@/components/ClassroomFiles";
import { one } from "@/components/ErrorNote";
import { getCourse, getGoogleConnection, listClassroomFiles } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = PageProps<"/u/[uni]/[code]/slides">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  return { title: course ? `${course.code} slides` : "Slides" };
}

export default async function CourseSlidesPage({ params, searchParams }: Props) {
  const { uni, code } = await params;
  const query = await searchParams;
  const course = await getCourse(uni, code);
  if (!course) notFound();
  const base = `/u/${course.university_slug}/${course.code}/slides`;

  const session = await getSession();
  if (!session) {
    return (
      <div className="max-w-xl">
        <p className="font-semibold">Your Classroom slides for {course.code}</p>
        <p className="mt-1 text-sm text-ink-soft">
          Sign in and connect Google Classroom to see the slides and files your
          teachers posted for this subject.
        </p>
        <Link href={`/login?next=${encodeURIComponent(base)}`} className="btn mt-4">
          Sign in
        </Link>
      </div>
    );
  }

  const [connection, files] = await Promise.all([
    getGoogleConnection(session.userId),
    listClassroomFiles(session.userId, course.id),
  ]);
  if (!connection || connection.scopes !== "files") {
    return (
      <div className="max-w-xl">
        <p className="font-semibold">Connect Google Classroom</p>
        <p className="mt-1 text-sm text-ink-soft">
          {connection
            ? "Connect again and allow the new Classroom permissions to load your slides."
            : "Sabaq lists the slides and files from your Classroom class for this subject."}
        </p>
        <a href="/api/google/connect" className="btn mt-4">
          {connection ? "Connect again" : "Connect Google Classroom"}
        </a>
      </div>
    );
  }

  const filter: FileFilter = one(query.type) === "all" ? "all" : "lectures";
  const shown = filter === "all" ? files : files.filter(isLectureFile);
  const counts = { lectures: files.filter(isLectureFile).length, all: files.length };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FileFilterTabs base={base} active={filter} counts={counts} />
        <Link href="/tasks/slides" className="text-sm underline">
          All my subjects
        </Link>
      </div>
      <div className="mt-6">
        {shown.length === 0 ? (
          <p className="text-ink-soft">
            {files.length === 0
              ? `No Classroom class matched ${course.code} yet. Sync on My work, or check the class name in Classroom.`
              : "No slides or PDFs here yet. Switch to All files."}
          </p>
        ) : (
          <ClassroomFileList files={shown} />
        )}
      </div>
    </div>
  );
}
