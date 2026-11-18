"use client";

import { useEffect, useRef } from "react";

// A 3D field of coding assignments, projects and code that flies toward the
// viewer through fog, over a drifting perspective grid. The camera leans with
// the mouse and pushes forward when the page scrolls. Every new item decodes
// from scrambled symbols. Plain 2D canvas with a perspective projection, so
// there is no WebGL or 3D library to download.

const CARDS: [string, string][] = [
  ["Assignment 3", "Linked List ADT"],
  ["OOP Project", "Bank Management System"],
  ["DSA Assignment 2", "ImageLab: undo / redo"],
  ["Lab 7", "Pointers and dynamic arrays"],
  ["Semester Project", "Library Management System"],
  ["Quiz 4", "Recursion, Section A"],
  ["Assignment 1", "Matrix class with operators"],
  ["DB Project", "University portal in SQL"],
  ["COAL Lab", "Bubble sort in x86"],
  ["AI Assignment", "A* path finding"],
  ["OS Project", "CPU scheduler simulator"],
  ["Final Year Project", "Proposal defence"],
  ["PF Assignment", "Tic-tac-toe in C++"],
  ["Networks Lab", "Socket chat app"],
  ["SDA Project", "Use case and class diagrams"],
  ["Web Project", "Next.js + Supabase app"],
  ["Hackathon", "NaSCon build, 24 hours"],
  ["DSA Assignment 4", "Graph BFS and DFS"],
];

const DUE = ["Due Fri 11:59 PM", "Due tomorrow", "Due Mon 9:00 AM", "Submitted", "Due in 3 days", "Graded 9/10"];

const CODE = [
  "for (int i = 0; i < n; i++)",
  "class Node { int data; Node* next; };",
  "Node* temp = head;",
  "while (temp != nullptr)",
  "return dp[n];",
  "queue.push(start);",
  "SELECT name FROM students;",
  "virtual double area() = 0;",
  "std::vector<int> v;",
  "public static void main(String[] args)",
  "O(n log n)",
  "git commit -m \"final\"",
  "if (left > right) return -1;",
  "mid = (low + high) / 2;",
  "#include <iostream>",
  "delete[] arr;",
  "T(n) = 2T(n/2) + n",
  "mov eax, [ebp+8]",
  "int main() {",
  "cout << \"Hello FAST\";",
  "graph[u].push_back(v);",
  "stack.pop();",
  "npm run build",
  "def bfs(graph, s):",
];

const SYMBOLS = ["{ }", "</>", "( )", "[ ]", "::", "&&", "->", "==", "++", "//", "#", ";"];
const GLYPHS = "+=-*/<>{}[]#%&";

type Kind = "card" | "code" | "symbol";

type Item = {
  kind: Kind;
  title: string;
  sub: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  born: number;
  tint: number; // 0 ink, 1 margin, 2 highlighter
};

const NEAR = 0.35;
const FAR = 7;

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => s.getPropertyValue(n).trim() || f;
  return {
    paper: v("--color-paper", "#f3f6f4"),
    sheet: v("--color-sheet", "#fdfefd"),
    ink: v("--color-ink", "#14213d"),
    soft: v("--color-ink-soft", "#55627c"),
    rule: v("--color-rule", "#c5d3e4"),
    margin: v("--color-margin", "#e0616f"),
    hi: v("--color-hi", "#ffe45c"),
    ultra: v("--color-ultra", "#2f45ff"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

/** Text that decodes left to right out of scrambled glyphs. */
function scrambled(text: string, progress: number) {
  if (progress >= 1) return text;
  const fixed = Math.floor(text.length * progress);
  let out = text.slice(0, fixed);
  for (let i = fixed; i < text.length; i++) {
    out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return out;
}

export function CodeSpace({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let colors = readColors();
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let gridShift = 0;

    // Camera state, eased toward targets.
    const cam = { x: 0, y: 0, tx: 0, ty: 0, boost: 0 };
    let lastScroll = window.scrollY;

    const small = () => w < 700;
    const items: Item[] = [];

    function make(now: number, z?: number): Item {
      const r = Math.random();
      const kind: Kind = r < 0.38 ? "card" : r < 0.85 ? "code" : "symbol";
      const card = pick(CARDS);
      const spread = small() ? 1.25 : 1.9;
      return {
        kind,
        title: kind === "card" ? card[0] : kind === "code" ? pick(CODE) : pick(SYMBOLS),
        sub: kind === "card" ? card[1] : "",
        x: (Math.random() * 2 - 1) * spread,
        y: (Math.random() * 2 - 1) * 1.1,
        z: z ?? FAR,
        speed: 0.18 + Math.random() * 0.22,
        born: z === undefined ? now : now - 5000,
        tint: kind === "card" ? (Math.random() < 0.25 ? 2 : 1) : Math.random() < 0.12 ? 1 : 0,
      };
    }

    function populate(now: number) {
      items.length = 0;
      const count = Math.round((small() ? 46 : 90) * density);
      for (let i = 0; i < count; i++) items.push(make(now, NEAR + Math.random() * (FAR - NEAR)));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const wasSmall = w > 0 && small();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (items.length === 0 || wasSmall !== small()) populate(performance.now());
    }

    function project(x: number, y: number, z: number) {
      const f = 1 / z;
      const scale = Math.min(w, h * 1.4) * 0.55;
      return {
        sx: w / 2 + (x - cam.x * z * 0.12) * f * scale,
        sy: h / 2 + (y - cam.y * z * 0.12) * f * scale,
        f,
      };
    }

    function fog(z: number) {
      const far = Math.min(1, (FAR - z) / 2.2); // fade in from the distance
      const near = Math.min(1, (z - NEAR) / 0.5); // fade out right before the lens
      return Math.max(0, Math.min(far, near));
    }

    function drawGrid() {
      // A floor grid receding to a horizon, scrolling toward the viewer.
      ctx!.save();
      ctx!.strokeStyle = colors.rule;
      ctx!.lineWidth = 1;
      const floorY = 1.15;
      for (let i = 0; i < 16; i++) {
        const z = NEAR + ((i * 0.45 - gridShift) % 7.2 + 7.2) % 7.2;
        if (z < NEAR + 0.05) continue;
        const a = project(-6, floorY, z);
        const b = project(6, floorY, z);
        ctx!.globalAlpha = 0.35 * fog(z) * (colors.dark ? 0.8 : 1);
        ctx!.beginPath();
        ctx!.moveTo(a.sx, a.sy);
        ctx!.lineTo(b.sx, b.sy);
        ctx!.stroke();
      }
      for (let x = -6; x <= 6; x += 0.75) {
        const a = project(x, floorY, NEAR + 0.05);
        const b = project(x, floorY, FAR);
        const g = ctx!.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
        g.addColorStop(0, "transparent");
        g.addColorStop(0.35, colors.rule);
        g.addColorStop(1, "transparent");
        ctx!.globalAlpha = colors.dark ? 0.28 : 0.35;
        ctx!.strokeStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(a.sx, a.sy);
        ctx!.lineTo(b.sx, b.sy);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function roundRect(x: number, y: number, rw: number, rh: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx!.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx!.arcTo(x, y + rh, x, y, r);
      ctx!.arcTo(x, y, x + rw, y, r);
      ctx!.closePath();
    }

    function drawItem(it: Item, now: number) {
      const p = project(it.x, it.y, it.z);
      if (p.sx < -400 || p.sx > w + 400 || p.sy < -200 || p.sy > h + 200) return;
      const alpha = fog(it.z);
      if (alpha <= 0.01) return;
      const decode = still ? 1 : Math.min(1, (now - it.born) / 900);
      const size = Math.max(6, Math.min(40, 13 * p.f));
      const tintColor = it.kind === "card" ? colors.ink : it.tint === 1 ? colors.margin : it.tint === 0 && it.title.length % 3 === 0 ? colors.ultra : colors.ink;

      if (it.kind === "card") {
        ctx!.font = `700 ${size}px 'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif`;
        const title = scrambled(it.title, decode);
        const subSize = size * 0.78;
        const tw = ctx!.measureText(it.title).width;
        ctx!.font = `500 ${subSize}px 'Figtree Variable', ui-sans-serif, system-ui, sans-serif`;
        const sw = ctx!.measureText(it.sub).width;
        const due = DUE[(it.title.length + it.sub.length) % DUE.length];
        const dueSize = size * 0.62;
        const pad = size * 0.7;
        const cw = Math.max(tw, sw) + pad * 2 + size * 0.4;
        const ch = size + subSize + dueSize + pad * 2.2;
        const x = p.sx - cw / 2;
        const y = p.sy - ch / 2;

        ctx!.globalAlpha = alpha * (colors.dark ? 0.55 : 0.75);
        ctx!.fillStyle = colors.sheet;
        roundRect(x, y, cw, ch, size * 0.3);
        ctx!.fill();
        ctx!.globalAlpha = alpha * 0.9;
        ctx!.strokeStyle = colors.rule;
        ctx!.lineWidth = Math.max(0.5, p.f * 0.8);
        ctx!.stroke();
        // Margin line, like every sheet on the site.
        ctx!.fillStyle = it.tint === 1 ? colors.margin : colors.ultra;
        ctx!.globalAlpha = alpha * 0.85;
        ctx!.fillRect(x + size * 0.45, y, Math.max(1, p.f * 1.1), ch);

        const left = x + pad + size * 0.4;
        if (it.tint === 2) {
          ctx!.globalAlpha = alpha * (colors.dark ? 0.6 : 0.75);
          ctx!.fillStyle = colors.hi;
          ctx!.fillRect(left - 3, y + pad - size * 0.05, tw * decode + 6, size * 1.05);
        }
        ctx!.globalAlpha = alpha * 0.9;
        ctx!.fillStyle = tintColor === colors.margin ? colors.ink : colors.ink;
        ctx!.font = `700 ${size}px 'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif`;
        ctx!.textBaseline = "top";
        ctx!.fillText(title, left, y + pad);
        ctx!.globalAlpha = alpha * 0.7;
        ctx!.fillStyle = colors.soft;
        ctx!.font = `500 ${subSize}px 'Figtree Variable', ui-sans-serif, system-ui, sans-serif`;
        ctx!.fillText(scrambled(it.sub, Math.max(0, decode * 1.3 - 0.3)), left, y + pad + size * 1.15);
        ctx!.globalAlpha = alpha * 0.85;
        ctx!.fillStyle = due.startsWith("Due") ? colors.margin : colors.soft;
        ctx!.font = `700 ${dueSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        ctx!.fillText(scrambled(due.toUpperCase(), Math.max(0, decode * 1.6 - 0.6)), left, y + pad + size * 1.15 + subSize * 1.25);
        ctx!.textBaseline = "alphabetic";
      } else {
        const mono = it.kind === "code";
        ctx!.font = mono
          ? `500 ${size * 0.95}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
          : `800 ${size * 1.6}px 'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif`;
        ctx!.globalAlpha = alpha * (mono ? 0.55 : 0.35);
        ctx!.fillStyle = tintColor;
        ctx!.textAlign = "center";
        ctx!.fillText(scrambled(it.title, decode), p.sx, p.sy);
        ctx!.textAlign = "start";
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      cam.x += (cam.tx - cam.x) * Math.min(1, dt * 3);
      cam.y += (cam.ty - cam.y) * Math.min(1, dt * 3);
      cam.boost *= Math.pow(0.04, dt);
      const travel = still ? 0 : dt * (1 + cam.boost);

      ctx!.clearRect(0, 0, w, h);
      drawGrid();
      gridShift += travel * 0.35;

      for (const it of items) {
        it.z -= it.speed * travel;
        if (it.z < NEAR) Object.assign(it, make(now));
      }
      // Far items first so near ones draw on top.
      items.sort((a, b) => b.z - a.z);
      for (const it of items) drawItem(it, now);
      ctx!.globalAlpha = 1;

      if (!still) raf = requestAnimationFrame(frame);
    }

    resize();
    if (still) frame(performance.now());
    else raf = requestAnimationFrame(frame);

    const onMove = (e: PointerEvent) => {
      cam.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      cam.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      cam.boost = Math.min(14, cam.boost + Math.abs(dy) * 0.05);
    };
    const onVisibility = () => {
      if (still) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const ro = new ResizeObserver(() => {
      resize();
      if (still) frame(performance.now());
    });
    const mo = new MutationObserver(() => {
      colors = readColors();
      if (still) frame(performance.now());
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ro.observe(canvas);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      mo.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden="true" className="block h-full w-full" />;
}
