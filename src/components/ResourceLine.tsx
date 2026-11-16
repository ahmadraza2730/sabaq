import Link from "next/link";
import { toggleVote } from "@/app/actions";
import { isConfigured } from "@/lib/config";
import { TYPE_LABELS, type Resource } from "@/lib/types";

/** One file on a ruled line: votes in the margin, details on the line. */
export function ResourceLine({
  resource,
  voted,
  path,
  showCourse = false,
}: {
  resource: Resource;
  voted: boolean;
  path: string;
  showCourse?: boolean;
}) {
  const details = [
    TYPE_LABELS[resource.type],
    resource.year ? String(resource.year) : null,
    resource.uploader_name ? `by ${resource.uploader_name}` : null,
    resource.campus_name,
    `${resource.downloads} ${resource.downloads === 1 ? "download" : "downloads"}`,
  ].filter(Boolean);

  return (
    <li className="line">
      <div className="in-margin">
        {isConfigured ? (
          <form action={toggleVote.bind(null, resource.id, path)}>
            <button
              aria-pressed={voted}
              aria-label={
                voted
                  ? `Remove your upvote, ${resource.votes} upvotes`
                  : `Upvote, ${resource.votes} upvotes`
              }
              className={`cursor-pointer rounded px-2 py-0.5 text-sm font-semibold tabular-nums ${
                voted ? "bg-hi" : "hover:bg-paper"
              }`}
            >
              <span aria-hidden="true">▲ </span>
              {resource.votes}
            </button>
          </form>
        ) : (
          <span className="px-2 text-sm font-semibold tabular-nums">
            <span aria-hidden="true">▲ </span>
            {resource.votes}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className="font-medium">{resource.title}</p>
          <p className="text-sm text-ink-soft">
            {showCourse && (
              <>
                <Link
                  href={`/u/${resource.university_slug}/${resource.course_code}`}
                  className="font-medium text-ink underline"
                >
                  {resource.course_code}
                </Link>
                {", "}
              </>
            )}
            {details.join(", ")}
          </p>
        </div>
        {isConfigured ? (
          <a
            href={`/r/${resource.id}`}
            className="shrink-0 text-sm font-semibold underline"
          >
            Download
          </a>
        ) : (
          <span className="shrink-0 text-sm text-ink-soft">Sample file</span>
        )}
      </div>
    </li>
  );
}
