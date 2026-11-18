import Link from "next/link";

/** A ruled notebook page in ultramarine ink, with its coral margin line. */
export function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Sabaq home">
      <svg width="28" height="32" viewBox="0 0 26 30" aria-hidden="true" className="transition-transform duration-300 group-hover:-rotate-6">
        <defs>
          <linearGradient id="logo-ink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-ultra)" />
            <stop offset="1" stopColor="var(--color-ultra-2)" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="24" height="28" rx="5" fill="url(#logo-ink)" />
        <line x1="8" y1="1" x2="8" y2="29" stroke="var(--color-margin)" strokeWidth="2" />
        <line x1="11" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="15" x2="21" y2="15" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="20" x2="17" y2="20" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight">Sabaq</span>
    </Link>
  );
}
