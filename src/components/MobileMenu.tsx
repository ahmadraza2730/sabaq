"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

type Item = { href: string; label: string };

/** The phone menu. Keyed by path, so it closes after every navigation. */
export function MobileMenu({
  items,
  signedIn,
}: {
  items: Item[];
  signedIn: boolean;
}) {
  const pathname = usePathname();

  return (
    <details key={pathname} className="group relative lg:hidden">
      <summary
        className="grid size-9 cursor-pointer list-none place-items-center rounded border border-rule bg-sheet hover:border-ink [&::-webkit-details-marker]:hidden"
        aria-label="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="group-open:hidden">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="hidden group-open:block">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </summary>
      <nav
        aria-label="Menu"
        className="absolute right-0 top-11 z-50 grid w-56 overflow-hidden rounded border border-rule bg-sheet text-sm font-medium shadow-lg"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className="border-b border-rule px-4 py-3 last:border-b-0 hover:bg-paper aria-[current=page]:font-bold"
          >
            {item.label}
          </Link>
        ))}
        {signedIn && (
          <form action={signOut}>
            <button className="w-full cursor-pointer px-4 py-3 text-left text-ink-soft hover:bg-paper">
              Sign out
            </button>
          </form>
        )}
      </nav>
    </details>
  );
}
