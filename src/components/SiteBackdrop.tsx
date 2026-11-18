"use client";

import { usePathname } from "next/navigation";
import { CodeSpace } from "@/components/CodeSpace";

// Full strength on the landing and sign-in pages; quieter where people read
// and write (course pages, practice editor, My work) so text stays easy.
const LOUD = new Set(["/", "/login", "/onboarding"]);

export function SiteBackdrop() {
  const path = usePathname() ?? "/";
  const loud = LOUD.has(path);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700"
      style={{ opacity: loud ? 1 : 0.38 }}
    >
      <CodeSpace density={loud ? 1 : 0.7} />
      {/* A soft wash down the middle column, where the reading happens. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,color-mix(in_srgb,var(--color-paper)_70%,transparent)_0%,color-mix(in_srgb,var(--color-paper)_20%,transparent)_70%,transparent_100%)]" />
    </div>
  );
}
