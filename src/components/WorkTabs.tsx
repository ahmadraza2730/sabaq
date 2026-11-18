import Link from "next/link";

/** Switch between due work and Classroom slides on the My work pages. */
export function WorkTabs({ active }: { active: "work" | "slides" }) {
  const tabs = [
    { key: "work", href: "/tasks", label: "Due work" },
    { key: "slides", href: "/tasks/slides", label: "Slides and files" },
  ] as const;
  return (
    <nav aria-label="My work" className="mt-6 flex gap-6 border-b border-rule text-sm font-semibold">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={`-mb-px border-b-2 pb-2 ${
            active === tab.key
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
