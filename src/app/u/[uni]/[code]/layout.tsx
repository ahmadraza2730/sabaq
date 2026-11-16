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
      <p className="pt-4 text-sm text-ink-soft">
        <Link href={`/u/${course.university_slug}`} className="underline">
          {course.university_name}
        </Link>{" "}
        / Semester {course.semester}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        {course.title}
      </h1>
      <p className="mt-2 text-lg font-semibold tabular-nums text-ink-soft">
        {course.code}
      </p>
      <CourseTabs base={base} />
      <div className="pt-6">{children}</div>
    </>
  );
}
