"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through words in one spot. All words share one grid cell, so the
 * line never changes width or jumps. Screen readers get the full list once.
 */
export function WordCycle({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="word-cycle">
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="inline-grid">
        {words.map((word, i) => (
          <span key={word} data-on={i === index ? "" : undefined} className="word-cycle-item">
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
