import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseTabs } from "@/components/CourseTabs";
import { getCourse } from "@/lib/data";

export default async function CourseLayout({
  children,
  params,
}: LayoutProps<"/u/[uni]/[code]">) {
  const { uni, code } = await params;
  const course = await getCourse(uni, code);
  if (!course) notFound();

  const base = `/u/${course.university_slug}/${course.code}`;

  return (
    <>
      <p className="pt-8 text-sm text-ink-soft">
        <Link href={`/u/${course.university_slug}`} className="underline">
          {course.university_name}
        </Link>{" "}
        /{" "}
        <Link
          href={`/u/${course.university_slug}#semester-${course.semester}`}
          className="underline"
        >
          Semester {course.semester}
        </Link>
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {course.title}
      </h1>
      <p className="mt-2 flex flex-wrap gap-x-5 text-lg tabular-nums text-ink-soft">
        <span className="font-semibold">{course.code}</span>
        {course.credit_hours && (
          <span>{course.credit_hours} credit hours</span>
        )}
      </p>
      <CourseTabs base={base} />
      <div className="pt-6">{children}</div>
    </>
  );
}
