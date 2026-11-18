import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveCredit, PastPaperList } from "@/components/PastPaperList";
import { one } from "@/components/ErrorNote";
import { listPastPapers } from "@/lib/pastPapers";

export const metadata: Metadata = {
  title: "FAST past papers",
  description: "Sessionals, mids and finals for FAST-NUCES Islamabad courses, semester by semester.",
};
export const revalidate = 3600;

export default async function PastPapersPage({ searchParams }: PageProps<"/past-papers">) {
  const query = await searchParams;
  const q = (one(query.q) ?? "").trim().toLowerCase();
  const all = (await listPastPapers()).filter((p) => p.kind !== "Course outline");
  const papers = q ? all.filter((p) => `${p.name} ${p.folder}`.toLowerCase().includes(q)) : all;

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8]
    .map((n) => ({
      n,
      folders: [...new Set(papers.filter((p) => p.semester === n).map((p) => p.folder))].sort(),
    }))
    .filter((s) => s.folders.length > 0);

  return (
    <div className="pt-10">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
        FAST <span className="ink-gradient">past papers</span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        {all.length} sessionals, mids and finals, many with solutions, sorted by
        semester and course. Each course page also shows its own.
      </p>
      <div className="mt-3">
        <ArchiveCredit />
      </div>

      <form className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="pq" className="sr-only">Search past papers</label>
        <input id="pq" name="q" defaultValue={q} placeholder="Course or exam, such as DLD Final or OOP 2024" className="field" />
        <button className="btn">Search</button>
      </form>

      <nav aria-label="Semesters" className="mt-5 flex flex-wrap gap-1.5 text-sm">
        {semesters.map((s) => (
          <a key={s.n} href={`#sem-${s.n}`} className="rounded border border-rule bg-sheet px-3 py-1.5 font-semibold hover:border-ultra">
            Semester {s.n}
          </a>
        ))}
        {q && (
          <Link href="/past-papers" className="px-2 py-1.5 underline">
            Clear search
          </Link>
        )}
      </nav>

      {semesters.length === 0 && <p className="mt-10 text-ink-soft">Nothing matches that search.</p>}

      {semesters.map((s) => (
        <section key={s.n} id={`sem-${s.n}`} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Semester {s.n}</h2>
          {s.folders.map((folder) => {
            const items = papers.filter((p) => p.semester === s.n && p.folder === folder);
            const code = items[0]?.courseCode;
            return (
              <details key={folder} className="group mt-4" open={Boolean(q)}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded border border-rule bg-sheet px-4 py-3 font-semibold hover:border-ultra [&::-webkit-details-marker]:hidden">
                  <span>
                    {folder}
                    {code && <span className="ml-2 text-sm font-normal text-ink-soft">{code}</span>}
                  </span>
                  <span className="text-sm font-normal tabular-nums text-ink-soft">
                    {items.length} {items.length === 1 ? "paper" : "papers"}
                    <span className="ml-2 inline-block transition-transform group-open:rotate-90">›</span>
                  </span>
                </summary>
                <div className="mt-3">
                  {code && (
                    <p className="mb-3 text-sm">
                      <Link href={`/u/fast-nuces/${code}`} className="ink-link font-semibold">
                        Open the {code} course page
                      </Link>
                    </p>
                  )}
                  <PastPaperList papers={items} />
                </div>
              </details>
            );
          })}
        </section>
      ))}
    </div>
  );
}
