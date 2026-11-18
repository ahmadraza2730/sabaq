import Link from "next/link";
import type { ClassroomFile } from "@/lib/data";

export type FileFilter = "lectures" | "all";

const TYPE_LABEL: Record<ClassroomFile["file_type"], string> = {
  slides: "Slides",
  pdf: "PDF",
  doc: "Doc",
  sheet: "Sheet",
  video: "Video",
  link: "Link",
  form: "Form",
  file: "File",
};

const SOURCE_LABEL: Record<ClassroomFile["source"], string> = {
  material: "Material",
  announcement: "Announcement",
  assignment: "Assignment",
};

export function isLectureFile(f: ClassroomFile) {
  return f.file_type === "slides" || f.file_type === "pdf";
}

function day(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
  });
}

/** Lecture files / All files switch, as links so it works without JavaScript. */
export function FileFilterTabs({
  base,
  active,
  counts,
}: {
  base: string;
  active: FileFilter;
  counts: Record<FileFilter, number>;
}) {
  const options: { key: FileFilter; label: string }[] = [
    { key: "lectures", label: "Slides and PDFs" },
    { key: "all", label: "All files" },
  ];
  return (
    <nav aria-label="File type" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.key === "lectures" ? base : `${base}?type=all`}
          aria-current={active === o.key ? "page" : undefined}
          className={`rounded border px-3 py-1.5 text-sm font-semibold ${
            active === o.key ? "border-ink bg-ink text-sheet" : "border-rule bg-sheet hover:border-ink"
          }`}
        >
          {o.label} <span className="font-normal tabular-nums opacity-80">{counts[o.key]}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Files grouped by their Classroom topic (or "No topic"), newest first. */
export function ClassroomFileList({ files }: { files: ClassroomFile[] }) {
  const groups = new Map<string, ClassroomFile[]>();
  for (const f of files) {
    const key = f.topic?.trim() || "No topic";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  return (
    <div className="grid gap-5">
      {[...groups.entries()].map(([topic, items]) => (
        <section key={topic}>
          {groups.size > 1 && <h4 className="mb-2 text-sm font-semibold text-ink-soft">{topic}</h4>}
          <ul className="sheet">
            {items.map((f) => (
              <li key={f.id} className="line">
                <span
                  className={`in-margin text-xs font-semibold ${
                    f.file_type === "slides" ? "text-margin" : "text-ink-soft"
                  }`}
                >
                  {TYPE_LABEL[f.file_type]}
                </span>
                <span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
                  <span className="min-w-0">
                    <a
                      href={f.url}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="break-words font-medium hover:underline"
                    >
                      {f.title}
                    </a>
                    {f.post_title && f.post_title !== f.title && (
                      <span className="block truncate text-sm text-ink-soft">
                        {SOURCE_LABEL[f.source]}: {f.post_title}
                      </span>
                    )}
                  </span>
                  <span className="flex gap-4 text-sm tabular-nums text-ink-soft">
                    {f.post_link && (
                      <a href={f.post_link} rel="noopener noreferrer" target="_blank" className="underline">
                        Post
                      </a>
                    )}
                    <span>{day(f.posted_at)}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
