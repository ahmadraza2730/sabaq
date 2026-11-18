// A notebook page that writes itself: lines draw in, a code snippet types,
// a due date gets circled and ticked. Pure SVG + CSS, so it costs nothing.

export function HeroArt() {
  return (
    <svg
      viewBox="0 0 420 330"
      role="img"
      aria-label="A notebook page with code being written, a due date circled and ticked"
      className="hero-art h-auto w-full"
    >
      <defs>
        <clipPath id="page">
          <rect x="18" y="14" width="384" height="300" rx="6" />
        </clipPath>
      </defs>

      {/* Back page, slightly turned */}
      <rect x="34" y="26" width="384" height="300" rx="6" className="fill-paper stroke-rule" strokeWidth="1.5" transform="rotate(2.2 226 176)" />

      <g clipPath="url(#page)">
        <rect x="18" y="14" width="384" height="300" rx="6" className="fill-sheet" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1="18" x2="402" y1={52 + i * 30} y2={52 + i * 30} className="stroke-rule" strokeWidth="1" />
        ))}
        <line x1="70" x2="70" y1="14" y2="314" className="stroke-margin" strokeWidth="2" />
      </g>
      <rect x="18" y="14" width="384" height="300" rx="6" fill="none" className="stroke-rule" strokeWidth="1.5" />

      {/* Spiral binding */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx="34" cy={40 + i * 36} r="5" className="fill-paper stroke-ink-soft" strokeWidth="1.5" />
      ))}

      {/* Heading, highlighted */}
      <rect x="84" y="28" width="168" height="20" rx="3" className="art-hi fill-hi" />
      <text x="90" y="44" className="art-type fill-ink font-display" fontSize="17" fontWeight="800">
        Data Structures
      </text>

      {/* Code, typed line by line */}
      <g className="font-mono fill-ink" fontSize="13">
        <text x="84" y="76" className="art-line" style={{ "--d": "0.6s" } as React.CSSProperties}>
          <tspan className="fill-[var(--code-keyword)]">void</tspan> push(<tspan className="fill-[var(--code-type)]">int</tspan> x) {"{"}
        </text>
        <text x="100" y="106" className="art-line" style={{ "--d": "1.1s" } as React.CSSProperties}>
          Node* n = <tspan className="fill-[var(--code-keyword)]">new</tspan> Node(x);
        </text>
        <text x="100" y="136" className="art-line" style={{ "--d": "1.6s" } as React.CSSProperties}>
          n-&gt;next = top; top = n;
        </text>
        <text x="84" y="166" className="art-line" style={{ "--d": "2.1s" } as React.CSSProperties}>
          {"}"} <tspan className="fill-[var(--code-comment)]">{"// O(1)"}</tspan>
        </text>
      </g>

      {/* To-do list */}
      <g className="font-sans" fontSize="14">
        <text x="84" y="226" className="art-line fill-ink" style={{ "--d": "2.6s" } as React.CSSProperties}>
          Assignment 2: linked list
        </text>
        <text x="84" y="256" className="art-line fill-ink-soft" style={{ "--d": "2.9s" } as React.CSSProperties}>
          Quiz 3, Section A
        </text>
        <text x="270" y="226" className="art-line fill-margin font-semibold" style={{ "--d": "3.2s" } as React.CSSProperties}>
          Fri 11:59
        </text>
      </g>

      {/* Circle around the due date, then a tick in the margin */}
      <ellipse cx="303" cy="221" rx="44" ry="15" fill="none" className="art-draw stroke-margin" strokeWidth="2" pathLength={1} style={{ "--d": "3.6s" } as React.CSSProperties} />
      <path d="M44 220 l7 8 l14 -16" fill="none" className="art-draw stroke-ok" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ "--d": "4.2s" } as React.CSSProperties} />
      <path d="M44 250 l7 8 l14 -16" fill="none" className="art-draw stroke-ok" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ "--d": "4.6s" } as React.CSSProperties} />

      {/* The pen */}
      <g className="art-pen">
        <path d="M0 0 l58 -58 l10 10 l-58 58 z" className="fill-ink" />
        <path d="M0 0 l-6 16 l16 -6 z" className="fill-ink-soft" />
        <path d="M52 -52 l10 10" className="stroke-margin" strokeWidth="6" />
      </g>
    </svg>
  );
}
