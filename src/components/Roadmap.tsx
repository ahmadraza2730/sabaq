import Link from "next/link";
import { sumCredits, type Course, type ElectiveSlot } from "@/lib/types";

type Row =
  | { kind: "course"; position: number; course: Course }
  | { kind: "slot"; position: number; slot: ElectiveSlot };

function bySemester(courses: Course[], slots: ElectiveSlot[]) {
  const semesters = new Map<number, Row[]>();
  for (const course of courses) {
    const rows = semesters.get(course.semester) ?? [];
    rows.push({ kind: "course", position: course.position ?? 99, course });
    semesters.set(course.semester, rows);
  }
  for (const slot of slots) {
    const rows = semesters.get(slot.semester) ?? [];
    rows.push({ kind: "slot", position: slot.position, slot });
    semesters.set(slot.semester, rows);
  }
  return [...semesters.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semester, rows]) => {
      rows.sort((a, b) => a.position - b.position);
      const [theory, lab] = sumCredits(
        rows.map((r) =>
          r.kind === "course" ? r.course.credit_hours : r.slot.credit_hours,
        ),
      );
      const hasCredits = rows.some((r) =>
        r.kind === "course" ? r.course.credit_hours : r.slot.credit_hours,
      );
      return { semester, rows, credits: hasCredits ? `${theory}+${lab}` : null };
    });
}

/** Semester blocks side by side: the overview on the home page. */
export function RoadmapGrid({
  courses,
  slots,
  universitySlug,
}: {
  courses: Course[];
  slots: ElectiveSlot[];
  universitySlug: string;
}) {
  const semesters = bySemester(courses, slots);
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {semesters.map(({ semester, rows, credits }) => (
        <li key={semester} className="sheet sheet-tight flex flex-col">
          <div className="flex items-baseline justify-between gap-2 border-b border-rule py-2.5 pl-6 pr-4">
            <Link
              href={`/u/${universitySlug}#semester-${semester}`}
              className="font-display font-bold hover:underline"
            >
              Semester {semester}
            </Link>
            {credits && (
              <span className="text-xs tabular-nums text-ink-soft">
                {credits} credits
              </span>
            )}
          </div>
          <ul className="grid flex-1 content-start gap-1.5 py-3 pl-6 pr-4 text-sm">
            {rows.map((row) =>
              row.kind === "course" ? (
                <li key={row.course.id}>
                  <Link
                    href={`/u/${universitySlug}/${row.course.code}`}
                    className="leading-snug hover:underline"
                  >
                    {row.course.title}
                  </Link>
                </li>
              ) : (
                <li key={row.slot.id} className="leading-snug text-ink-soft">
                  {row.slot.label}
                </li>
              ),
            )}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/** Every semester as a ruled table: the university page. */
export function RoadmapTable({
  courses,
  slots,
  universitySlug,
}: {
  courses: Course[];
  slots: ElectiveSlot[];
  universitySlug: string;
}) {
  const semesters = bySemester(courses, slots);
  return (
    <>
      {semesters.map(({ semester, rows, credits }) => (
        <section
          key={semester}
          id={`semester-${semester}`}
          className="mb-10 scroll-mt-24"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h3 className="font-display text-xl font-bold">Semester {semester}</h3>
            {credits && (
              <span className="text-sm tabular-nums text-ink-soft">
                {credits} credit hours
              </span>
            )}
          </div>
          <ul className="sheet">
            {rows.map((row) =>
              row.kind === "course" ? (
                <li key={row.course.id} className="line">
                  <span className="in-margin text-sm font-semibold tabular-nums text-ink-soft">
                    {row.course.code}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
                    <Link
                      href={`/u/${universitySlug}/${row.course.code}`}
                      className="font-medium hover:underline"
                    >
                      {row.course.title}
                    </Link>
                    <span className="flex gap-5 text-sm tabular-nums text-ink-soft">
                      {row.course.credit_hours && (
                        <span title="Credit hours, theory+lab">
                          {row.course.credit_hours}
                        </span>
                      )}
                      <span className="min-w-[4.5rem] text-right">
                        {row.course.resource_count === 0
                          ? "No files"
                          : `${row.course.resource_count} ${
                              row.course.resource_count === 1 ? "file" : "files"
                            }`}
                      </span>
                    </span>
                  </span>
                </li>
              ) : (
                <li key={row.slot.id} className="line bg-paper/60">
                  <span className="in-margin text-sm tabular-nums text-ink-soft">
                    {row.slot.code_hint}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
                    <span className="text-ink-soft">
                      {row.slot.label}.{" "}
                      <a href="#add-course" className="text-sm text-ink underline">
                        Add the one you took
                      </a>
                    </span>
                    {row.slot.credit_hours && (
                      <span className="text-sm tabular-nums text-ink-soft">
                        {row.slot.credit_hours}
                      </span>
                    )}
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </>
  );
}

export function semestersIn(courses: Course[], slots: ElectiveSlot[]) {
  return [...new Set([...courses, ...slots].map((x) => x.semester))].sort(
    (a, b) => a - b,
  );
}
