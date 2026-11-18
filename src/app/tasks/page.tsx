import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addTask,
  deleteTask,
  disconnectClassroom,
  setTaskDone,
  syncClassroomNow,
} from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { isClassroomConfigured } from "@/lib/classroom";
import { getGoogleConnection, listProgramRoadmap, listTasks } from "@/lib/data";
import { isProgram } from "@/lib/fast";
import { getSession } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My work" };

const TZ = "Asia/Karachi";

/** Calendar day in Pakistan time, as YYYY-MM-DD, for grouping. */
function pkDay(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

function formatDue(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function calendarLink(task: Task) {
  if (!task.due_at) return null;
  const end = new Date(task.due_at);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Due: ${task.title}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: [task.group_label, task.link].filter(Boolean).join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

type Group = { key: string; title: string; tasks: Task[]; tone?: "alert" };

function groupTasks(tasks: Task[]): { open: Group[]; done: Task[] } {
  const now = new Date();
  const today = pkDay(now);
  const tomorrow = pkDay(new Date(now.getTime() + 86_400_000));
  const weekEnd = pkDay(new Date(now.getTime() + 7 * 86_400_000));

  const groups: Record<string, Group> = {
    overdue: { key: "overdue", title: "Overdue", tasks: [], tone: "alert" },
    today: { key: "today", title: "Due today", tasks: [] },
    tomorrow: { key: "tomorrow", title: "Due tomorrow", tasks: [] },
    week: { key: "week", title: "This week", tasks: [] },
    later: { key: "later", title: "Later", tasks: [] },
    none: { key: "none", title: "No due date", tasks: [] },
  };
  const done: Task[] = [];

  for (const task of tasks) {
    if (task.done) {
      done.push(task);
      continue;
    }
    if (!task.due_at) {
      groups.none.tasks.push(task);
      continue;
    }
    const due = new Date(task.due_at);
    const day = pkDay(due);
    if (due < now) groups.overdue.tasks.push(task);
    else if (day === today) groups.today.tasks.push(task);
    else if (day === tomorrow) groups.tomorrow.tasks.push(task);
    else if (day <= weekEnd) groups.week.tasks.push(task);
    else groups.later.tasks.push(task);
  }
  done.sort((a, b) => (b.due_at ?? b.created_at).localeCompare(a.due_at ?? a.created_at));
  return { open: Object.values(groups).filter((g) => g.tasks.length > 0), done: done.slice(0, 30) };
}

function TaskRow({ task }: { task: Task }) {
  const calendar = calendarLink(task);
  return (
    <li className="line">
      <span className="in-margin">
        <form action={setTaskDone.bind(null, task.id, !task.done)}>
          <button
            className={`grid size-6 cursor-pointer place-items-center rounded border-2 ${
              task.done ? "border-ok bg-ok text-sheet" : "border-ink-soft hover:border-ink"
            }`}
            aria-label={task.done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
            aria-pressed={task.done}
          >
            {task.done && (
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span className={`font-medium ${task.done ? "text-ink-soft line-through" : ""}`}>
            {task.link ? (
              <a href={task.link} rel="noopener noreferrer" className="hover:underline">
                {task.title}
              </a>
            ) : (
              task.title
            )}
          </span>
          {task.due_at && (
            <span className="text-sm tabular-nums text-ink-soft">{formatDue(task.due_at)}</span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          {task.group_label && <span>{task.group_label}</span>}
          {task.source === "classroom" && <span>From Classroom</span>}
          {calendar && !task.done && (
            <a href={calendar} rel="noopener noreferrer" className="underline">
              Add to Google Calendar
            </a>
          )}
          {task.source === "manual" && (
            <form action={deleteTask.bind(null, task.id)}>
              <button className="cursor-pointer underline">Delete</button>
            </form>
          )}
        </span>
        {task.notes && task.source === "manual" && (
          <span className="mt-1 block whitespace-pre-line text-sm">{task.notes}</span>
        )}
      </span>
    </li>
  );
}

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=%2Ftasks");

  const program = isProgram(session.profile.program) ? session.profile.program : "CS";
  const [tasks, connection, roadmap] = await Promise.all([
    listTasks(session.userId),
    getGoogleConnection(session.userId),
    listProgramRoadmap(program),
  ]);
  const { open, done } = groupTasks(tasks);
  const semester = session.profile.current_semester;
  const myCourses = roadmap.filter((c) => c.semester === semester);
  const otherCourses = roadmap.filter((c) => c.semester !== semester);
  const classroomReady = isClassroomConfigured();
  const synced = one(query.synced);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            My work
          </h1>
          <p className="mt-2 text-ink-soft">
            Assignments, quizzes and reminders in one list, sorted by when
            they are due. Times are Pakistan time.
          </p>
        </div>
      </div>

      <ErrorNote message={one(query.error)} />
      {synced && (
        <p role="status" className="my-4 rounded bg-hi p-3 text-sm font-medium">
          Synced {synced} {synced === "1" ? "item" : "items"} from{" "}
          {one(query.courses)} Classroom {one(query.courses) === "1" ? "class" : "classes"}.
          {Number(one(query.events) ?? 0) > 0 &&
            ` Updated ${one(query.events)} Google Calendar ${one(query.events) === "1" ? "event" : "events"}.`}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          {open.length === 0 && (
            <div className="sheet">
              <p className="line">
                <span className="in-margin" />
                <span>
                  Nothing pending.{" "}
                  {connection
                    ? "Sync Classroom to check for new work, or add a reminder."
                    : "Add a reminder, or connect Google Classroom to pull in your assignments."}
                </span>
              </p>
            </div>
          )}
          {open.map((group) => (
            <section key={group.key} className="mb-8">
              <h2
                className={`mb-3 flex items-baseline gap-2 font-display text-xl font-bold ${
                  group.tone === "alert" ? "text-margin" : ""
                }`}
              >
                {group.title}
                <span className="text-sm font-normal tabular-nums text-ink-soft">
                  {group.tasks.length}
                </span>
              </h2>
              <ul className="sheet">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </section>
          ))}
          {done.length > 0 && (
            <details className="mb-8">
              <summary className="cursor-pointer font-display text-xl font-bold">
                Done <span className="text-sm font-normal text-ink-soft">{done.length}</span>
              </summary>
              <ul className="sheet mt-3">
                {done.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside className="grid content-start gap-6">
          <section className="sheet sheet-tight p-5 pl-6">
            <h2 className="font-display text-lg font-bold">Add a reminder</h2>
            <form action={addTask} className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm font-medium">
                What is due
                <input
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Such as OOP Assignment 3"
                  className="field"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Course
                <select name="course_id" defaultValue="" className="field">
                  <option value="">No course</option>
                  {myCourses.length > 0 && (
                    <optgroup label={`Semester ${semester}`}>
                      {myCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} {c.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other courses">
                    {otherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} {c.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <div className="grid grid-cols-[1fr_7rem] gap-2">
                <label className="grid gap-1 text-sm font-medium">
                  Due date
                  <input name="due_date" type="date" className="field" />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Time
                  <input name="due_time" type="time" defaultValue="23:59" className="field" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-medium">
                Notes (optional)
                <textarea name="notes" rows={2} maxLength={2000} className="field" />
              </label>
              <div>
                <button className="btn">Add reminder</button>
              </div>
            </form>
          </section>

          <section className="sheet sheet-tight p-5 pl-6">
            <h2 className="font-display text-lg font-bold">Google Classroom and Calendar</h2>
            {!classroomReady ? (
              <p className="mt-2 text-sm text-ink-soft">
                Classroom sync is not set up on this site yet.
              </p>
            ) : connection ? (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Connected as{" "}
                  <span className="font-medium text-ink">
                    {connection.google_email ?? "your Google account"}
                  </span>
                  .{" "}
                  {connection.last_synced_at
                    ? `Last synced ${formatDue(connection.last_synced_at)}.`
                    : "Not synced yet."}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {connection.calendar_enabled
                    ? "Open work with a due date is also in your Google Calendar, with reminders a day and two hours before."
                    : "Calendar is off. Disconnect and connect again, and allow Calendar, to get due dates in your Google Calendar."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={syncClassroomNow}>
                    <button className="btn">Sync now</button>
                  </form>
                  <form action={disconnectClassroom}>
                    <button className="btn btn-quiet">Disconnect</button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Pull your classes&apos; assignments and due dates in, see
                  which you have not turned in, and get each due date in your
                  Google Calendar with reminders. Sabaq never submits or
                  changes anything in Classroom.
                </p>
                <a href="/api/google/connect" className="btn mt-3">
                  Connect Google Classroom
                </a>
              </>
            )}
          </section>

          {!session.profile.roll_number && (
            <p className="text-sm">
              <Link href="/onboarding?next=%2Ftasks" className="font-semibold underline">
                Set up your FAST profile
              </Link>{" "}
              to see your semester&apos;s courses first.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
