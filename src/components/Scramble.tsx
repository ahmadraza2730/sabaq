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
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      const fixed = Math.floor(text.length * p);
      let out = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) {
        const c = text[i];
        out += c === " " || c === "," || c === "." ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setShown(out);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick(performance.now());
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay]);

  return shown;
}

/**
 * Text that decodes out of scrambled symbols when it first appears. The real
 * text sets the size (so nothing jumps) and is what screen readers read.
 */
export function Scramble({ text, delay = 0, duration = 900 }: { text: string; delay?: number; duration?: number }) {
  const shown = useScramble(text, duration, delay);
  return (
    <span className="relative inline-block">
      <span className="invisible">{text}</span>
      <span aria-hidden="true" className="absolute inset-0">
        {shown}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
