"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Feeds the pointer position into every .lift / .spot card as --mx/--my, so
 * a soft red glow follows the cursor across it. One listener for the page.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = (e.target as Element | null)?.closest?.(".lift, .spot") as HTMLElement | null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${e.clientX - r.left}px`);
      target.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

function ProgressInner() {
  const path = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<number>(0);

  // Start when an internal link is clicked.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setState("loading");
    };
    const onSubmit = () => setState("loading");
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  // Finish when the URL actually changes.
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 450);
  }, [path, params]);

  return <div aria-hidden="true" className="nav-progress" data-state={state} />;
}

/** A thin red bar across the top while the next page loads. */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressInner />
    </Suspense>
  );
}

/** A number that counts up the first time it scrolls into view. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only count when the number starts below the fold; otherwise just show it.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    let id = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = () => {
          const t = Math.min(1, (performance.now() - start) / 1400);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(value * eased));
          if (t >= 1) window.clearInterval(id);
        };
        id = window.setInterval(step, 30);
        step();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

const TABS = [
  { href: "/", label: "Home", d: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/u/fast-nuces", label: "Courses", d: "M4 5h7v14H4zM13 5h7v14h-7z" },
  { href: "/past-papers", label: "Papers", d: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" },
  { href: "/practice", label: "Practice", d: "M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" },
  { href: "/tasks", label: "My work", d: "M5 5h14v16H5zM9 3v4M15 3v4M8 12l2.5 2.5L16 9" },
];

/** Phone tab bar, so the main sections are one thumb tap away. */
export function BottomNav() {
  const path = usePathname() ?? "/";
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-sheet/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                  on ? "text-ultra" : "text-ink-soft"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={t.d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
