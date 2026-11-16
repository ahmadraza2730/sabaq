import type { Course, ElectiveSlot, Resource } from "@/lib/types";

// Shown only while no database is connected, so the site is browsable
// from the first deploy. Nothing here is a real upload.

const rows: [string, string, number, string, number][] = [
  ["SS1019", "Understanding of Sirat-Un-Nabi (PBUH)", 1, "NC+0", 1],
  ["MT1003", "Calculus and Analytical Geometry", 1, "3+0", 2],
  ["CL1000", "Introduction to Information and Communication Technology", 1, "0+1", 3],
  ["CS1002", "Programming Fundamentals", 1, "3+1", 4],
  ["SS1012", "Functional English", 1, "2+1", 5],
  ["SS1013", "Ideology and Constitution of Pakistan", 1, "2+0", 6],
  ["SS1007", "Islamic Studies/Ethics", 1, "2+0", 7],
  ["SS1015", "Pakistan Studies", 2, "2+0", 1],
  ["CS1004", "Object Oriented Programming", 2, "3+1", 4],
  ["SS1014", "Expository Writing", 2, "2+1", 5],
  ["SS1021", "Understanding of Holy Quran I", 2, "1+0", 6],
  ["SS1022", "Understanding of Holy Quran II", 2, "1+0", 7],
  ["EE1005", "Digital Logic Design", 3, "3+1", 2],
  ["CS2001", "Data Structures", 3, "3+1", 3],
  ["MG4011", "Entrepreneurship", 3, "3+0", 4],
  ["MT1004", "Linear Algebra", 4, "3+0", 1],
  ["EE2003", "Computer Organization and Assembly Language", 4, "3+1", 2],
  ["CS2006", "Operating Systems", 4, "3+1", 3],
  ["CS3004", "Software Design and Analysis", 4, "3+0", 4],
  ["CS3005", "Theory of Automata", 4, "3+0", 5],
  ["SS2043", "Civics and Community Engagement", 4, "2+0", 6],
  ["CS3001", "Computer Networks", 5, "3+1", 2],
  ["CS2009", "Design and Analysis of Algorithms", 5, "3+0", 3],
  ["AI2002", "Artificial Intelligence", 5, "3+1", 5],
  ["CS2005", "Database Systems", 6, "3+1", 3],
  ["CS3009", "Software Engineering", 6, "3+0", 4],
  ["CS3002", "Information Security", 6, "3+0", 5],
  ["CS4091", "Final Year Project I", 7, "0+3", 4],
  ["CS4075", "Cloud Computing", 7, "3+0", 5],
  ["CS4092", "Final Year Project II", 8, "0+3", 4],
  ["CS2019", "Computing Internship", 8, "0+1", 6],
];

const slotRows: [number, string, string, string, number][] = [
  [2, "MTxxxx", "Qualitative Reasoning I", "3+0", 2],
  [2, "NSxxxx", "Natural Science Elective", "3+0", 3],
  [3, "MTxxxx", "Qualitative Reasoning II", "3+0", 1],
  [3, "AHX21", "Arts and Humanities Elective I", "2+0", 5],
  [3, "SSX31", "Social Sciences Elective I", "3+0", 6],
  [5, "CSX01", "CS Elective I", "3+0", 1],
  [5, "IDSxxxx", "Inter-Disciplinary Elective I", "3+0", 4],
  [6, "CSX02", "CS Elective II", "3+0", 1],
  [6, "CSX03", "CS Elective III", "3+0", 2],
  [7, "CSX04", "CS Elective IV", "3+0", 1],
  [7, "CSX05", "CS Elective V", "3+0", 2],
  [7, "IDSxxxx", "Inter-Disciplinary Elective II", "3+0", 3],
  [8, "CSxxxx", "CS Elective VI", "3+0", 1],
  [8, "CSX07", "CS Elective VII", "3+0", 2],
  [8, "CSX08", "CS Elective VIII", "3+0", 3],
  [8, "CSxxxx", "Professional Certification", "3+0", 5],
];

export const sampleSlots: ElectiveSlot[] = slotRows.map(
  ([semester, code_hint, label, credit_hours, position], i) => ({
    id: `slot-${i}`,
    program: "BS Computer Science",
    semester,
    code_hint,
    label,
    credit_hours,
    position,
  }),
);

const sampleFiles: [string, string, Resource["type"], number, number, number][] =
  [
    ["CS2001", "Linked lists and stacks, handwritten notes", "notes", 2026, 14, 61],
    ["CS2001", "Midterm 1 with solutions", "past_paper", 2025, 22, 118],
    ["CS2001", "Assignment 2 with report", "assignment", 2026, 6, 27],
    ["CS1004", "Inheritance and polymorphism summary", "notes", 2026, 9, 44],
    ["CS1004", "Final exam", "past_paper", 2025, 17, 96],
    ["CS1002", "Pointers and arrays cheat sheet", "notes", 2025, 11, 70],
    ["MT1004", "Eigenvalues worked problems", "notes", 2026, 5, 19],
  ];

export const sampleResources: Resource[] = sampleFiles.map(
  ([code, title, type, year, votes, downloads], i) => ({
    id: `sample-${i + 1}`,
    course_id: `sample-${code}`,
    uploader_id: "sample-user",
    title,
    type,
    year,
    file_name: "sample.pdf",
    status: "approved",
    downloads,
    created_at: new Date(2026, 9, 1 + i).toISOString(),
    course_code: code,
    course_title: rows.find((r) => r[0] === code)?.[1] ?? "",
    university_slug: "fast-nuces",
    uploader_name: "Sample student",
    campus_name: "Islamabad",
    votes,
  }),
);

export const sampleCourses: Course[] = rows.map(([code, title, semester, credits, position]) => ({
  id: `sample-${code}`,
  code,
  title,
  semester,
  university_slug: "fast-nuces",
  university_name: "FAST-NUCES",
  resource_count: sampleResources.filter((r) => r.course_code === code).length,
  credit_hours: credits,
  program: "BS Computer Science",
  position,
}));
