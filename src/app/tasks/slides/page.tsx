import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClassroomFileList,
  type FileFilter,
  FileFilterTabs,
  isLectureFile,
} from "@/components/ClassroomFiles";
import { one } from "@/components/ErrorNote";
import { WorkTabs } from "@/components/WorkTabs";
import { getGoogleConnection, listClassroomClasses, listClassroomFiles, listCourses } from "@/lib/data";
import { sectionLabel } from "@/lib/fast";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Slides and files" };

export default async function SlidesPage({ searchParams }: PageProps<"/tasks/slides">) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=%2Ftasks%2Fslides");

  const filter: FileFilter = one(query.type) === "all" ? "all" : "lectures";
  const [connection, classes, files, courses] = await Promise.all([
    getGoogleConnection(session.userId),
    listClassroomClasses(session.userId),
    listClassroomFiles(session.userId),
    listCourses(),
  ]);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const shown = filter === "all" ? files : files.filter(isLectureFile);
  const counts = { lectures: files.filter(isLectureFile).length, all: files.length };
  const mySection = sectionLabel(
    session.profile.program,
    session.profile.current_semester,
    session.profile.section,
  );

  return (
    <>
      <div className="pt-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">My work</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every slide deck, PDF and link your teachers posted in Google Classroom,
          sorted by subject and topic
          {mySection ? <>, for <span className="font-semibold text-ink">{mySection}</span></> : null}.
        </p>
      </div>
      <WorkTabs active="slides" />

      {!connection ? (
        <div className="sheet sheet-tight mt-8 max-w-xl p-6 pl-7">
          <p className="font-semibold">Connect Google Classroom first</p>
          <p className="mt-1 text-sm text-ink-soft">
            Sabaq reads the files your teachers attach to materials, announcements
            and assignments. It never changes anything in Classroom.
          </p>
          <a href="/api/google/connect" className="btn mt-4">
            Connect Google Classroom
          </a>
        </div>
      ) : connection.scopes !== "files" ? (
        <div className="sheet sheet-tight mt-8 max-w-xl p-6 pl-7">
          <p className="font-semibold">Allow Sabaq to read Classroom files</p>
          <p className="mt-1 text-sm text-ink-soft">
            You connected before slides were added. Connect again and allow the
            new Classroom permissions; your reminders stay as they are.
          </p>
          <a href="/api/google/connect" className="btn mt-4">
            Connect again
          </a>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <FileFilterTabs base="/tasks/slides" active={filter} counts={counts} />
          </div>
          {classes.length === 0 && (
            <p className="mt-8 text-ink-soft">No Classroom classes yet. Sync on the Due work tab.</p>
          )}
          {classes.map((cls) => {
            const items = shown.filter((f) => f.classroom_course === cls.external_id);
            const course = cls.course_id ? courseById.get(cls.course_id) : undefined;
            return (
              <section key={cls.external_id} className="mt-10">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-display text-2xl font-bold">
                    {cls.name}
                    {cls.section && (
                      <span className="ml-2 text-base font-normal text-ink-soft">{cls.section}</span>
                    )}
                  </h2>
                  <p className="flex gap-4 text-sm">
                    {course && (
                      <Link
                        href={`/u/${course.university_slug}/${course.code}/slides`}
                        className="underline"
                      >
                        {course.code} on Sabaq
                      </Link>
                    )}
                    {cls.link && (
                      <a href={cls.link} rel="noopener noreferrer" target="_blank" className="underline">
                        Open in Classroom
                      </a>
                    )}
                  </p>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    {filter === "lectures" ? "No slides or PDFs posted yet." : "No files posted yet."}
                  </p>
                ) : (
                  <ClassroomFileList files={items} />
                )}
              </section>
            );
          })}
        </>
      )}
    </>
  );
}
