"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Cycles through words in one spot. The box eases to each word's width, so
 * punctuation after it stays snug. Screen readers get the full list once.
 */
export function WordCycle({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = items.current[index];
      if (el) setWidth(el.getBoundingClientRect().width);
    };
    measure();
    // Fonts can finish loading after the first measure.
    document.fonts?.ready.then(measure).catch(() => undefined);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  return (
    <span className="word-cycle">
      <span className="sr-only">{words.join(", ")}</span>
      <span
        aria-hidden="true"
        className="word-cycle-box"
        style={width === null ? undefined : { width }}
      >
        {words.map((word, i) => (
          <span
            key={word}
            ref={(el) => {
              items.current[i] = el;
            }}
            data-on={i === index ? "" : undefined}
            className="word-cycle-item"
          >
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
