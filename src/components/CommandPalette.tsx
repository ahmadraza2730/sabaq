"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Index = {
  courses: { code: string; title: string; uni: string }[];
  papers: { folder: string; code: string | null; semester: number | null; count: number }[];
  problems: { slug: string; title: string; track: string; difficulty: string }[];
};

type Result = { group: string; label: string; hint: string; href: string };

const PAGES: Result[] = [
  { group: "Pages", label: "My work", hint: "Due work and reminders", href: "/tasks" },
  { group: "Pages", label: "Slides and files", hint: "From Google Classroom", href: "/tasks/slides" },
  { group: "Pages", label: "Past papers", hint: "Every semester", href: "/past-papers" },
  { group: "Pages", label: "Coding practice", hint: "PF, OOP, DSA", href: "/practice" },
  { group: "Pages", label: "Compiler", hint: "C++ and Java", href: "/compiler" },
  { group: "Pages", label: "Study assistant", hint: "Ask anything", href: "/assistant" },
  { group: "Pages", label: "Team finder", hint: "Projects and hackathons", href: "/teams" },
  { group: "Pages", label: "Upload a file", hint: "Notes, papers, assignments", href: "/upload" },
  { group: "Pages", label: "Courses", hint: "All FAST courses", href: "/u/fast-nuces" },
  { group: "Pages", label: "Your profile", hint: "Roll number and section", href: "/profile" },
];

/** Score a candidate: every query word must appear; earlier and word-start hits rank higher. */
function score(text: string, words: string[]) {
  const t = text.toLowerCase();
  let total = 0;
  for (const w of words) {
    const i = t.indexOf(w);
    if (i < 0) return -1;
    total += i === 0 ? 30 : /\W/.test(t[i - 1] ?? " ") ? 20 : 8;
    total -= i * 0.05;
  }
  return total;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<Index | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const load = useCallback(() => {
    if (index) return;
    fetch("/api/palette")
      .then((r) => r.json())
      .then((data: Index) => setIndex(data))
      .catch(() => undefined);
  }, [index]);

  const show = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      const editor = e.target instanceof HTMLElement && e.target.closest(".cm-editor");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      } else if (e.key === "/" && !typing && !editor && !open) {
        e.preventDefault();
        show();
      }
    };
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener("sabaq:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sabaq:search", onOpen);
    };
  }, [open, show]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all: (Result & { s: number })[] = [];
    const add = (r: Result, text: string, boost = 0) => {
      const s = words.length ? score(text, words) : 1;
      if (s >= 0) all.push({ ...r, s: s + boost });
    };
    for (const p of PAGES) add(p, `${p.label} ${p.hint}`, 5);
    for (const c of index?.courses ?? []) {
      add({ group: "Courses", label: c.title, hint: c.code, href: `/u/${c.uni}/${c.code}` }, `${c.code} ${c.title}`, 3);
    }
    for (const p of index?.papers ?? []) {
      add(
        {
          group: "Past papers",
          label: `${p.folder} past papers`,
          hint: `${p.count} ${p.count === 1 ? "paper" : "papers"}`,
          href: p.code ? `/u/fast-nuces/${p.code}` : `/past-papers?q=${encodeURIComponent(p.folder)}`,
        },
        `${p.folder} ${p.code ?? ""} past papers sessional final mid`,
      );
    }
    for (const p of index?.problems ?? []) {
      add(
        { group: "Practice", label: p.title, hint: `${p.track}, ${p.difficulty}`, href: `/practice/${p.slug}` },
        `${p.title} ${p.track} ${p.difficulty} practice`,
      );
    }
    if (!words.length) return all.filter((r) => r.group === "Pages");
    return all.sort((a, b) => b.s - a.s).slice(0, 40);
  }, [query, index]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(r: Result | undefined) {
    if (!r) return;
    setOpen(false);
    router.push(r.href);
  }

  if (!open) return null;

  let lastGroup = "";
  return (
    <div
      className="palette-backdrop fixed inset-0 z-[70] grid items-start justify-items-center bg-[color-mix(in_srgb,var(--color-paper)_55%,transparent)] px-3 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Sabaq"
        className="palette-panel sheet sheet-tight w-full max-w-xl !overflow-visible p-0"
      >
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3 pl-6">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-ultra">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${active}` : undefined}
            placeholder="Search courses, past papers, practice..."
            className="w-full bg-transparent text-base outline-none placeholder:text-ink-soft"
          />
          <kbd className="hidden rounded border border-rule px-1.5 py-0.5 text-xs text-ink-soft sm:block">Esc</kbd>
        </div>
        <ul ref={list} id="palette-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2 pl-4">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-ink-soft">
              {index ? "Nothing matches. Try a course code like CS2001." : "Loading..."}
            </li>
          )}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <li key={`${r.group}:${r.href}:${r.label}`} role="presentation">
                {header && <p className="px-3 pb-1 pt-3 text-xs font-bold text-ink-soft">{r.group}</p>}
                <div
                  id={`palette-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded px-3 py-2.5 text-sm ${
                    i === active ? "bg-[color-mix(in_srgb,var(--color-ultra)_12%,transparent)] text-ink" : ""
                  }`}
                >
                  <span className="truncate font-medium">{r.label}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{r.hint}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-rule px-4 py-2 pl-6 text-xs text-ink-soft">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span className="ml-auto">Ctrl K</span>
        </div>
      </div>
    </div>
  );
}

/** The header button that opens the palette. */
export function SearchButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("sabaq:search"))}
      className="flex h-9 cursor-pointer items-center gap-2 rounded border border-rule bg-sheet/70 px-2.5 text-sm text-ink-soft hover:border-ultra hover:text-ink"
      aria-label="Search Sabaq (Ctrl K)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden rounded border border-rule px-1 text-[11px] xl:inline">Ctrl K</kbd>
    </button>
  );
}
