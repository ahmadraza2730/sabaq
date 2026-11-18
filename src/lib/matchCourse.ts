// Match a Google Classroom class name ("OOP BCS-3A Fall 26", "Data Structures Lab")
// to a Sabaq course. Lab classes match their own lab course when one exists.

export type CourseCandidate = { id: string; code: string; title: string; preferred?: boolean };

const SMALL = new Set(["and", "of", "to", "the", "for", "in", "a", "an", "&", "i", "ii", "iii"]);

// Common FAST short names that initials alone do not produce.
const ALIASES: Record<string, string[]> = {
  "Programming Fundamentals": ["pf"],
  "Object Oriented Programming": ["oop"],
  "Data Structures": ["ds", "dsa"],
  "Digital Logic Design": ["dld"],
  "Computer Organization and Assembly Language": ["coal"],
  "Database Systems": ["db", "dbs", "database"],
  "Operating Systems": ["os"],
  "Computer Networks": ["cn"],
  "Design and Analysis of Algorithms": ["daa", "algo", "algorithms"],
  "Theory of Automata": ["toa", "automata"],
  "Software Engineering": ["se"],
  "Artificial Intelligence": ["ai"],
  "Linear Algebra": ["la"],
  "Probability and Statistics": ["prob", "stats", "p&s"],
  "Multivariable Calculus": ["mvc"],
  "Calculus and Analytical Geometry": ["calculus", "cag"],
  "Discrete Structures": ["discrete"],
  "Introduction to Information and Communication Technology": ["ict", "iict"],
  "Software Design and Architecture": ["sda"],
  "Software Requirements Engineering": ["sre"],
  "Software Construction and Development": ["scd"],
  "Software Quality Engineering": ["sqe"],
  "Information Security": ["infosec", "is"],
  "Compiler Construction": ["cc", "compiler"],
  "Parallel and Distributed Computing": ["pdc"],
  "Machine Learning": ["ml"],
  "Deep Learning": ["dl"],
  "Functional English": ["english"],
  "Expository Writing": ["writing"],
};

function words(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9&+]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

function initials(title: string) {
  return words(title)
    .filter((w) => !SMALL.has(w))
    .map((w) => w[0])
    .join("");
}

function isLab(s: string) {
  return /\blab\b|\blaboratory\b/i.test(s);
}

export function matchCourse(className: string, courses: CourseCandidate[]): string | null {
  const name = className.toLowerCase();
  const tokens = new Set(words(className));
  const lab = isLab(className);
  let best: { id: string; score: number } | null = null;

  for (const course of courses) {
    let score = 0;
    const title = course.title.toLowerCase().replace(/\s*\(?lab\)?$/i, "").trim();
    if (name.includes(course.code.toLowerCase())) score = 100;
    else if (title.length > 3 && name.includes(title)) score = 90;
    else {
      const short = [initials(course.title), ...(ALIASES[course.title.replace(/\s+Lab$/i, "")] ?? [])];
      if (short.some((s) => s.length >= 2 && tokens.has(s))) score = 60;
      else {
        // Most of the title's main words appear in the class name.
        const main = words(title).filter((w) => !SMALL.has(w) && w.length > 2);
        const hits = main.filter((w) => tokens.has(w)).length;
        if (main.length > 0 && hits / main.length >= 0.75) score = 50;
      }
    }
    if (score === 0) continue;
    const courseIsLab = isLab(course.title) || /^CL\d/.test(course.code);
    if (lab === courseIsLab) score += 5;
    if (course.preferred) score += 3;
    if (!best || score > best.score) best = { id: course.id, score };
  }
  return best && best.score >= 50 ? best.id : null;
}
