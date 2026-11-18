import { KIND_ORDER, PAST_PAPER_REPO_URL, type PastPaper } from "@/lib/pastPapers";

function Badge({ children, tone = "soft" }: { children: React.ReactNode; tone?: "soft" | "ok" | "red" }) {
  const cls =
    tone === "ok"
      ? "border-ok/40 text-ok"
      : tone === "red"
        ? "border-margin/40 text-margin"
        : "border-rule text-ink-soft";
  return <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

/** Archive papers grouped by exam (Final, Mid, Sessionals...), newest first. */
export function PastPaperList({ papers, showFolder = false }: { papers: PastPaper[]; showFolder?: boolean }) {
  const groups = KIND_ORDER.map((kind) => ({ kind, items: papers.filter((p) => p.kind === kind) })).filter(
    (g) => g.items.length > 0,
  );
  return (
    <div className="grid gap-6">
      {groups.map(({ kind, items }) => (
        <section key={kind}>
          <h3 className="mb-2 flex items-baseline gap-2 font-display text-lg font-bold">
            {kind === "Other" ? "Other papers" : kind === "Course outline" ? "Course outlines" : `${kind} papers`}
            <span className="text-sm font-normal tabular-nums text-ink-soft">{items.length}</span>
          </h3>
          <ul className="sheet">
            {items.map((p) => (
              <li key={p.path} className="line">
                <span className="in-margin text-xs font-semibold uppercase text-ink-soft">{p.ext}</span>
                <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  <span className="min-w-0">
                    <a
                      href={p.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words font-medium hover:text-ultra"
                    >
                      {p.name.replace(/_/g, " ")}
                    </a>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {p.term && <Badge>{p.term}</Badge>}
                      {p.solution && <Badge tone="ok">With solution</Badge>}
                      {p.lab && <Badge tone="red">Lab</Badge>}
                      {showFolder && <Badge>{p.folder}</Badge>}
                    </span>
                  </span>
                  <span className="flex gap-2 text-sm">
                    <a href={p.viewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-quiet h-8 px-3 py-0">
                      View
                    </a>
                    <a href={p.downloadUrl} className="btn h-8 px-3 py-0" rel="noopener noreferrer">
                      Download
                    </a>
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

export function ArchiveCredit() {
  return (
    <p className="text-sm text-ink-soft">
      From the student-run{" "}
      <a href={PAST_PAPER_REPO_URL} target="_blank" rel="noopener noreferrer" className="ink-link font-semibold text-ink">
        FAST Islamabad past papers archive
      </a>{" "}
      on GitHub. Files open on GitHub; you can add yours there too.
    </p>
  );
}
