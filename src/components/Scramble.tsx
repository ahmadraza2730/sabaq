"use client";

import { useEffect, useState } from "react";

const GLYPHS = "+=-*/<>{}[]#%&";

/** Decode `text` out of scrambled symbols, left to right. */
export function useScramble(text: string, duration = 800, delay = 0) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    const start = performance.now() + delay;
    const step = () => {
      const p = Math.max(0, Math.min(1, (performance.now() - start) / duration));
      const fixed = Math.floor(text.length * p);
      let out = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) {
        const c = text[i];
        out += c === " " || c === "," || c === "." ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setShown(out);
      if (p >= 1) window.clearInterval(id);
    };
    // A timer, not requestAnimationFrame: it still finishes in a background tab.
    const id = window.setInterval(step, 40);
    // Whatever happens, land on the real text.
    const done = window.setTimeout(() => setShown(text), delay + duration + 150);
    step();
    return () => {
      window.clearInterval(id);
      window.clearTimeout(done);
    };
  }, [text, duration, delay]);

  return shown;
}

/**
 * Text that decodes out of scrambled symbols when it first appears. The real
 * text sets the size (so nothing jumps) and is what screen readers read.
 */
export function Scramble({
  text,
  delay = 0,
  duration = 900,
  className = "",
}: {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const shown = useScramble(text, duration, delay);
  return (
    <span className="relative inline-block">
      <span className="invisible">{text}</span>
      <span aria-hidden="true" className={`absolute inset-0 ${className}`}>
        {shown}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
