import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveCredit, PastPaperList } from "@/components/PastPaperList";
import { ResourceLine } from "@/components/ResourceLine";
import { pastPapersForCourse } from "@/lib/pastPapers";
import { getCourse, listMyVotes, listResources } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { TYPE_PLURALS, isResourceType, type ResourceType } from "@/lib/types";

type Props = PageProps<"/u/[uni]/[code]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  return { title: course ? `${course.code} ${course.title}` : "Course" };
}

export default async function CourseFilesPage({ params, searchParams }: Props) {
  const [{ uni, code }, query] = await Promise.all([params, searchParams]);
  const course = await getCourse(uni, code);
  if (!course) notFound();

  const type = isResourceType(query.type) ? query.type : undefined;
  const [resources, session, archive] = await Promise.all([
    listResources(course.id, type),
    getSession(),
    type && type !== "past_paper" ? Promise.resolve([]) : pastPapersForCourse(course.code),
  ]);
  const myVotes = session ? await listMyVotes(session.userId) : new Set<string>();

  const base = `/u/${course.university_slug}/${course.code}`;
  const path = type ? `${base}?type=${type}` : base;
  const filters: { label: string; value?: ResourceType }[] = [
    { label: "All" },
    { label: TYPE_PLURALS.notes, value: "notes" },
    { label: TYPE_PLURALS.past_paper, value: "past_paper" },
    { label: TYPE_PLURALS.assignment, value: "assignment" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by kind" className="flex flex-wrap gap-1 text-sm">
          {filters.map((filter) => {
            const active = filter.value === type;
            return (
              <Link
                key={filter.label}
                href={filter.value ? `${base}?type=${filter.value}` : base}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2.5 py-1 font-medium ${
                  active ? "bg-ink text-sheet" : "hover:bg-sheet"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        <Link href={`/upload?course=${course.id}`} className="btn">
          Upload to this course
        </Link>
      </div>

      {archive.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">
              Past papers <span className="text-base font-normal tabular-nums text-ink-soft">{archive.length}</span>
            </h2>
            <ArchiveCredit />
          </div>
          <PastPaperList papers={archive} />
        </section>
      )}

      {archive.length > 0 && (
        <h2 className="mb-4 font-display text-2xl font-bold">Uploaded by students on Sabaq</h2>
      )}
      {resources.length > 0 ? (
        <ul className="sheet">
          {resources.map((resource) => (
            <ResourceLine
              key={resource.id}
              resource={resource}
              voted={myVotes.has(resource.id)}
              path={path}
            />
          ))}
        </ul>
      ) : (
        <div className="sheet">
          <p className="line">
            <span className="in-margin" />
            <span>
              {type
                ? `No ${TYPE_PLURALS[type].toLowerCase()} here yet.`
                : "No files for this course yet."}{" "}
              <Link
                href={`/upload?course=${course.id}`}
                className="font-semibold underline"
              >
                Upload the first one
              </Link>
              .
            </span>
          </p>
        </div>
      )}
    </>
  );
}
