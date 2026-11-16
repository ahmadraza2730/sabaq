import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceLine } from "@/components/ResourceLine";
import { getCourse, listMyVotes, listResources } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { TYPE_PLURALS, isResourceType, type ResourceType } from "@/lib/types";

type Props = PageProps<"/u/[uni]/[code]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  return { title: course ? `${course.code} ${course.title}` : "Course" };
}

export default async function CoursePage({ params, searchParams }: Props) {
  const [{ uni, code }, query] = await Promise.all([params, searchParams]);
  const course = await getCourse(uni, code);
  if (!course) notFound();

  const type = isResourceType(query.type) ? query.type : undefined;
  const [resources, session] = await Promise.all([
    listResources(course.id, type),
    getSession(),
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
      <p className="pt-4 text-sm text-ink-soft">
        <Link href="/" className="underline">
          Courses
        </Link>{" "}
        / {course.university_name} / Semester {course.semester}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {course.title}
      </h1>
      <p className="mt-2 text-lg font-semibold tabular-nums text-ink-soft">
        {course.code}
      </p>

      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
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
