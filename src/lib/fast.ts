// FAST-NUCES specifics: degree programs, roll numbers, campuses.

export const PROGRAMS = {
  CS: "BS Computer Science",
  SE: "BS Software Engineering",
  AI: "BS Artificial Intelligence",
  DS: "BS Data Science",
  CY: "BS Cyber Security",
} as const;

export type Program = keyof typeof PROGRAMS;
export const PROGRAM_CODES = Object.keys(PROGRAMS) as Program[];

export function isProgram(value: unknown): value is Program {
  return typeof value === "string" && value in PROGRAMS;
}

/** The letter in a FAST roll number, mapped to the campus slug in the database. */
export const CAMPUS_LETTERS: Record<string, { slug: string; name: string }> = {
  I: { slug: "islamabad", name: "Islamabad" },
  L: { slug: "lahore", name: "Lahore" },
  K: { slug: "karachi", name: "Karachi" },
  P: { slug: "peshawar", name: "Peshawar" },
  F: { slug: "chiniot-faisalabad", name: "Chiniot-Faisalabad" },
  M: { slug: "multan", name: "Multan" },
};

export type RollNumber = {
  /** Normalised form, such as 23I-0567. */
  value: string;
  /** Intake year, such as 2023. */
  year: number;
  campus: { slug: string; name: string };
};

/**
 * Accepts the ways students write a roll number (23I-0567, 23i0567,
 * i230567, i23-0567) and returns the normalised form, or null.
 */
export function parseRollNumber(input: string): RollNumber | null {
  const raw = input.trim().toUpperCase().replace(/\s+/g, "");
  const match =
    raw.match(/^(\d{2})([ILKPFM])-?(\d{4})$/) ??
    raw.match(/^([ILKPFM])(\d{2})-?(\d{4})$/)?.slice(0, 4);
  if (!match) return null;

  // Second pattern has the letter first; put the parts back in order.
  const [year2, letter, digits] = /^\d/.test(match[1])
    ? [match[1], match[2], match[3]]
    : [match[2], match[1], match[3]];
  const campus = CAMPUS_LETTERS[letter];
  if (!campus) return null;
  return { value: `${year2}${letter}-${digits}`, year: 2000 + Number(year2), campus };
}

/** The section the way FAST writes it on timetables, such as BCS-3A. */
export function sectionLabel(program: string | null, semester: number | null, section: string | null) {
  if (!program || !semester || !section) return null;
  return `B${program}-${semester}${section}`;
}
