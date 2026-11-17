import Link from "next/link";

/** A ruled notebook page with its red margin line, next to the wordmark. */
export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Sabaq home">
      <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
        <rect x="1" y="1" width="24" height="28" rx="3" className="fill-sheet stroke-ink" strokeWidth="2" />
        <line x1="8" y1="2" x2="8" y2="28" className="stroke-margin" strokeWidth="2" />
        <line x1="11" y1="10" x2="21" y2="10" className="stroke-ink" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="15" x2="21" y2="15" className="stroke-rule" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="20" x2="17" y2="20" className="stroke-rule" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight">Sabaq</span>
    </Link>
  );
}
