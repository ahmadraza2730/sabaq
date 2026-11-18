"use client";

import { useEffect, useRef } from "react";

// A living notebook page: ruled lines drift upward while code, formulas and
// due dates write themselves in ballpoint ink, a highlighter swipes across
// some of them, and doodles appear in the margin. Drawn on a canvas so it
// stays sharp at any size and costs almost nothing; still under reduced motion.

const SNIPPETS = [
  "for (int i = 0; i < n; i++)",
  "O(n log n)",
  "class Node { Node* next; };",
  "Σ i = n(n + 1) / 2",
  "BFS(graph, start)",
  "SELECT * FROM students;",
  "Due Friday, 11:59 PM",
  "Quiz 3, Section A",
  "stack.push(x);",
  "p ∧ q → r",
  "f′(x) = 2x",
  "#include <iostream>",
  "return dp[n];",
  "merge(left, right)",
  "CS2001 Data Structures",
  "while (!done) study();",
  "Lab 5: pointers",
  "virtual double area() = 0;",
  "git commit -m \"final\"",
  "T(n) = 2T(n/2) + n",
  "mov eax, 1",
  "int* p = &x;",
  "Midterm: Week 8",
  "A ∪ B = B ∪ A",
  "sabaq",
];

type Writing = {
  text: string;
  x: number;
  row: number; // ruled-line index, in page space
  started: number;
  speed: number; // characters per second
  mono: boolean;
  highlight: boolean;
  alpha: number;
};

type Doodle = {
  kind: "circle" | "star" | "arrow" | "tick";
  x: number;
  row: number;
  size: number;
  started: number;
};

const ROW = 34;
const SCROLL = 7; // px per second

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    paper: v("--color-sheet", "#fdfefd"),
    ink: v("--color-ink", "#14213d"),
    rule: v("--color-rule", "#c5d3e4"),
    margin: v("--color-margin", "#e0616f"),
    hi: v("--color-hi", "#ffe45c"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

export function StudyBackdrop({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let colors = readColors();
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();
    let scroll = 0;
    let nextSpawn = 0;
    const writings: Writing[] = [];
    const doodles: Doodle[] = [];
    let pick = Math.floor(Math.random() * SNIPPETS.length);

    const marginX = () => Math.min(96, Math.max(40, width * 0.07));

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(now: number, rowHint?: number) {
      const text = SNIPPETS[pick++ % SNIPPETS.length];
      const firstVisible = Math.ceil(scroll / ROW);
      const rows = Math.max(4, Math.floor(height / ROW));
      const row = rowHint ?? firstVisible + Math.floor(rows * (0.35 + Math.random() * 0.6));
      if (writings.some((w) => w.row === row)) return;
      const mx = marginX();
      writings.push({
        text,
        row,
        x: mx + 18 + Math.random() * Math.max(10, width - mx - 18 - text.length * 9 - 30),
        started: now,
        speed: 14 + Math.random() * 10,
        mono: /[;(){}=<>*&]|^(mov|git|#)/.test(text),
        highlight: Math.random() < 0.28,
        alpha: 0.5 + Math.random() * 0.25,
      });
      if (Math.random() < 0.35) {
        doodles.push({
          kind: (["circle", "star", "arrow", "tick"] as const)[Math.floor(Math.random() * 4)],
          x: mx / 2,
          row,
          size: 9 + Math.random() * 5,
          started: now + 400,
        });
      }
    }

    function drawDoodle(d: Doodle, y: number, progress: number) {
      ctx!.save();
      ctx!.strokeStyle = colors.margin;
      ctx!.globalAlpha = 0.75;
      ctx!.lineWidth = 1.6;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      const s = d.size;
      if (d.kind === "circle") {
        ctx!.arc(d.x, y - 5, s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      } else if (d.kind === "tick") {
        const a = Math.min(1, progress * 2);
        const b = Math.max(0, progress * 2 - 1);
        ctx!.moveTo(d.x - s * 0.6, y - 5);
        ctx!.lineTo(d.x - s * 0.6 + s * 0.45 * a, y - 5 + s * 0.45 * a);
        if (b > 0) ctx!.lineTo(d.x - s * 0.15 + s * 0.85 * b, y - 5 + s * 0.45 - s * 1.1 * b);
      } else if (d.kind === "arrow") {
        const len = s * 1.6 * Math.min(1, progress * 1.4);
        ctx!.moveTo(d.x - s * 0.8, y - 5);
        ctx!.lineTo(d.x - s * 0.8 + len, y - 5);
        if (progress > 0.7) {
          ctx!.moveTo(d.x + s * 0.8, y - 5);
          ctx!.lineTo(d.x + s * 0.4, y - 9);
          ctx!.moveTo(d.x + s * 0.8, y - 5);
          ctx!.lineTo(d.x + s * 0.4, y - 1);
        }
      } else {
        const points = 5;
        const steps = Math.ceil(points * 2 * progress);
        for (let i = 0; i <= steps; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI) / points;
          const r = i % 2 === 0 ? s : s * 0.45;
          const px = d.x + Math.cos(angle) * r;
          const py = y - 5 + Math.sin(angle) * r;
          if (i === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
      }
      ctx!.stroke();
      ctx!.restore();
    }

    function frame(now: number) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!still) scroll += SCROLL * dt;

      ctx!.fillStyle = colors.paper;
      ctx!.fillRect(0, 0, width, height);

      // Ruled lines and the margin.
      const offset = scroll % ROW;
      ctx!.strokeStyle = colors.rule;
      ctx!.globalAlpha = colors.dark ? 0.55 : 0.8;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let y = ROW - offset; y < height; y += ROW) {
        ctx!.moveTo(0, Math.round(y) + 0.5);
        ctx!.lineTo(width, Math.round(y) + 0.5);
      }
      ctx!.stroke();
      ctx!.globalAlpha = 0.7;
      ctx!.fillStyle = colors.margin;
      ctx!.fillRect(marginX(), 0, 2, height);
      ctx!.globalAlpha = 1;

      // Writing.
      for (let i = writings.length - 1; i >= 0; i--) {
        const w = writings[i];
        const y = w.row * ROW - scroll - 9;
        if (y < -ROW) {
          writings.splice(i, 1);
          continue;
        }
        const elapsed = still ? 1e9 : Math.max(0, (now - w.started) / 1000);
        const chars = Math.min(w.text.length, Math.floor(elapsed * w.speed));
        const shown = w.text.slice(0, chars);
        ctx!.font = w.mono
          ? "500 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          : "600 17px 'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif";
        const full = ctx!.measureText(w.text).width;
        // Fade near the top edge.
        const fade = Math.min(1, Math.max(0, (y + 10) / 120));

        if (w.highlight && chars === w.text.length) {
          const t = Math.min(1, (elapsed - w.text.length / w.speed) / 0.6);
          if (t > 0) {
            ctx!.globalAlpha = (colors.dark ? 0.55 : 0.6) * fade;
            ctx!.fillStyle = colors.hi;
            ctx!.fillRect(w.x - 4, y - 15, (full + 8) * t, 20);
          }
        }
        ctx!.globalAlpha = w.alpha * fade;
        ctx!.fillStyle = colors.ink;
        ctx!.fillText(shown, w.x, y);

        if (!still && chars < w.text.length && Math.floor(now / 380) % 2 === 0) {
          const cx = w.x + ctx!.measureText(shown).width + 2;
          ctx!.fillRect(cx, y - 14, 1.5, 17);
        }
      }
      ctx!.globalAlpha = 1;

      for (let i = doodles.length - 1; i >= 0; i--) {
        const d = doodles[i];
        const y = d.row * ROW - scroll - 9;
        if (y < -ROW) {
          doodles.splice(i, 1);
          continue;
        }
        const p = still ? 1 : Math.min(1, Math.max(0, (now - d.started) / 900));
        if (p > 0) drawDoodle(d, y, p);
      }

      if (!still && now > nextSpawn) {
        spawn(now);
        nextSpawn = now + 900 + Math.random() * 1300;
      }
      if (!still) raf = requestAnimationFrame(frame);
    }

    resize();
    // Start with a half-written page so the first second is not empty.
    const start = performance.now();
    const rows = Math.max(4, Math.floor(height / ROW));
    for (let r = 2; r < rows; r += 2 + Math.floor(Math.random() * 2)) {
      spawn(start - 60_000, r);
    }
    if (still) {
      frame(start);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (still) frame(performance.now());
    });
    ro.observe(canvas);

    // Follow the light/dark switch.
    const mo = new MutationObserver(() => {
      colors = readColors();
      if (still) frame(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Stop drawing while the tab is hidden.
    const onVisibility = () => {
      if (still) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
