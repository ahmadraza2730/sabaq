import type { Course, Resource } from "@/lib/types";

// Shown only while no database is connected, so the site is browsable
// from the first deploy. Nothing here is a real upload.

const rows: [string, string, number][] = [
  ["CS1002", "Programming Fundamentals", 1],
  ["CL1000", "Introduction to Information and Communication Technology", 1],
  ["MT1003", "Calculus and Analytical Geometry", 1],
  ["NS1001", "Applied Physics", 1],
  ["SS1012", "Functional English", 1],
  ["CS1004", "Object Oriented Programming", 2],
  ["EE1005", "Digital Logic Design", 2],
  ["MT1008", "Multivariable Calculus", 2],
  ["CS1005", "Discrete Structures", 2],
  ["SS1014", "Expository Writing", 2],
  ["CS2001", "Data Structures", 3],
  ["EE2003", "Computer Organization and Assembly Language", 3],
  ["MT1004", "Linear Algebra", 3],
  ["MT2005", "Probability and Statistics", 3],
  ["CS2005", "Database Systems", 4],
  ["CS2006", "Operating Systems", 4],
  ["CS2009", "Design and Analysis of Algorithms", 4],
  ["CS3001", "Computer Networks", 4],
];

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

export const sampleCourses: Course[] = rows.map(([code, title, semester]) => ({
  id: `sample-${code}`,
  code,
  title,
  semester,
  university_slug: "fast-nuces",
  university_name: "FAST-NUCES",
  resource_count: sampleResources.filter((r) => r.course_code === code).length,
}));
