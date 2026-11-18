"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CourseTabs({ base }: { base: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: base, label: "Files", active: pathname === base },
    {
      href: `${base}/discuss`,
      label: "Discussion",
      active: pathname.startsWith(`${base}/discuss`),
    },
    {
      href: `${base}/slides`,
      label: "My slides",
      active: pathname.startsWith(`${base}/slides`),
    },
    {
      href: `${base}/ask`,
      label: "Ask the notes",
      active: pathname.startsWith(`${base}/ask`),
    },
  ];

  return (
    <nav
      aria-label="Course sections"
      className="mt-6 flex gap-6 overflow-x-auto whitespace-nowrap border-b border-rule text-sm font-semibold"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`-mb-px border-b-2 pb-2 ${
            tab.active
              ? "border-ink text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
