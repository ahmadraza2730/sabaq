// Decide whether a Classroom class, assignment or file is meant for the
// student's own section, from how FAST teachers usually label them:
// "BCS-3A", "CS 3B", "Section A", "Sec: A & B", "(3A/3C)".

export type StudentSection = {
  program: string | null; // CS, SE, AI, DS, CY
  semester: number | null;
  section: string | null; // "A", "B", "AB"...
};

type Mention = { program: string | null; letter: string };

const PROGRAM_ALIASES: Record<string, string> = {
  BCS: "CS",
  CS: "CS",
  BSCS: "CS",
  BSE: "SE",
  SE: "SE",
  BSSE: "SE",
  BAI: "AI",
  AI: "AI",
  BSAI: "AI",
  BDS: "DS",
  DS: "DS",
  BSDS: "DS",
  BCY: "CY",
  CY: "CY",
  BSCY: "CY",
};

const LIST_SPLIT = /\s*(?:,|\/|&|\+|\band\b)\s*/i;

/** Find every section a piece of text names. */
export function mentionedSections(text: string, semester: number | null): Mention[] {
  const found: Mention[] = [];

  // "Section A", "Sec-B", "Sections A, B and D", "SEC: C"
  for (const m of text.matchAll(/\bsec(?:tion)?s?\b\.?\s*[:#-]?\s*((?:[A-H]\b(?:\s*(?:,|\/|&|\+|and)\s*)?)+)/gi)) {
    for (const part of m[1].split(LIST_SPLIT)) {
      const letter = part.trim().toUpperCase();
      if (/^[A-H]$/.test(letter)) found.push({ program: null, letter });
    }
  }

  // "BCS-3A", "CS 3B", "BSE5C", "BCS-3A/3B"
  for (const m of text.matchAll(/\b(BS(?:CS|SE|AI|DS|CY)|B(?:CS|SE|AI|DS|CY)|CS|SE|AI|DS|CY)[-\s]?(\d)([A-H])((?:\s*[,/&]\s*\d?[A-H]\b)*)/g)) {
    const program = PROGRAM_ALIASES[m[1]] ?? null;
    if (semester && Number(m[2]) !== semester) continue;
    found.push({ program, letter: m[3] });
    for (const extra of (m[4] ?? "").split(/[,/&]/)) {
      const letter = extra.trim().replace(/^\d/, "");
      if (/^[A-H]$/.test(letter)) found.push({ program, letter });
    }
  }

  // A bare "3A" or "(3A, 3B)" only when the number is the student's semester.
  if (semester) {
    for (const m of text.matchAll(new RegExp(`(?<![\\w-])${semester}([A-H])\\b`, "g"))) {
      found.push({ program: null, letter: m[1] });
    }
  }
  return found;
}

/**
 * True when nothing in the texts names a section, or one of the named
 * sections is the student's. False only when the texts name other sections.
 */
export function isForMySection(texts: (string | null | undefined)[], me: StudentSection): boolean {
  if (!me.section) return true;
  const mine = me.section.toUpperCase();
  const mentions = texts.flatMap((t) => (t ? mentionedSections(t, me.semester) : []));
  if (mentions.length === 0) return true;
  return mentions.some(
    (m) => mine.includes(m.letter) && (!m.program || !me.program || m.program === me.program),
  );
}
