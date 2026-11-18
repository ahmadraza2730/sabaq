import "server-only";
import snapshot from "@/data/pastPapersSnapshot.json";

// Past papers from the student-run archive at
// github.com/nuces-isb-past-papers/fsc-past-papers. Sabaq does not copy the
// files: it reads the repository's file list (refreshed daily) and links to
// each paper on GitHub, credited to the archive.

export const PAST_PAPER_REPO = "nuces-isb-past-papers/fsc-past-papers";
export const PAST_PAPER_REPO_URL = `https://github.com/${PAST_PAPER_REPO}`;

// Folder name in the archive -> Sabaq course code. Explicit, because short
// names like "SDA" or "Multi Variable Calculus" are easy to mismatch.
const FOLDER_TO_CODE: Record<string, string> = {
  "applied physics (ap)": "NS1001",
  "applied physics": "NS1001",
  calculus: "MT1003",
  "functional english": "SS1012",
  pf: "CS1002",
  "pf-lab": "CS1002",
  "programming fundamentals": "CS1002",
  "programming fundamentals lab": "CS1002",
  "pakistan studies": "SS1015",
  "civics and community service": "SS2043",
  "digital logic design (dld)": "EE1005",
  "digital logic design": "EE1005",
  "digital logic design lab": "EE1005",
  "dld-lab": "EE1005",
  "expository writing": "SS1014",
  "islamic studies": "SS1007",
  "multi variable calculus": "MT1008",
  oop: "CS1004",
  "oop-lab": "CS1004",
  "object oriented programming": "CS1004",
  "object oriented programming lab": "CS1004",
  coal: "EE2003",
  "coal-lab": "EE2003",
  "coal lab": "EE2003",
  "data structures": "CS2001",
  "data structures lab": "CS2001",
  "discrete structures": "CS1005",
  "linear algebra": "MT1004",
  "programming for ai": "AI2001",
  "programming for ai lab": "AI2001",
  "database systems (db)": "CS2005",
  "database systems-lab (db-lab)": "CS2005",
  database: "CS2005",
  "database lab": "CS2005",
  "operating systems (os)": "CS2006",
  "operating systems": "CS2006",
  "operating systems lab": "CS2006",
  "os-lab": "CS2006",
  "probability and statistics": "MT2005",
  "computer networks (cnet)": "CS3001",
  "computer networks lab": "CS3001",
  "computer networks": "CS3001",
  "design & analysis of algorithms (algo)": "CS2009",
  "design analysis of algorithms": "CS2009",
  "knowledge representation and reasoning (krr)": "AI3001",
  sda: "CS3004",
  "software design analysis (sda)": "CS3004",
  "theory of automata": "CS3005",
  "ai lab": "AI2002",
  "artificial intelligence (ai)": "AI2002",
  "artificial intelligence": "AI2002",
  "artificial intelligence lab": "AI2002",
  "software engineering (se)": "CS3009",
  "software engineering": "CS3009",
  "cloud computing": "CS4075",
  "computer vision": "AI4002",
  "information security (info sec)": "CS3002",
  "fundamentals of spm": "SE4092",
  "data mining": "DS3005",
};

const FILE_TYPES = /\.(pdf|docx?|pptx?|png|jpe?g|zip|txt|sql)$/i;

export type PastPaperKind =
  | "Sessional I"
  | "Sessional II"
  | "Mid"
  | "Final"
  | "Quiz"
  | "Assignment"
  | "Course outline"
  | "Other";

export type PastPaper = {
  path: string;
  name: string; // file name without extension
  folder: string; // course folder in the archive
  semester: number | null;
  courseCode: string | null;
  kind: PastPaperKind;
  term: string | null; // "Fall 2023"
  year: number | null;
  solution: boolean;
  lab: boolean;
  ext: string;
  viewUrl: string;
  downloadUrl: string;
};

function kindOf(name: string, isOutline: boolean): PastPaperKind {
  if (isOutline) return "Course outline";
  const n = name.toLowerCase();
  if (/sess+(?:ional)?[\s#_-]*0?(ii|2)\b|mid[\s-]*2|mid[\s-]*ii\b/.test(n)) return "Sessional II";
  if (/sess+(?:ional)?[\s#_-]*0?(i|1)\b|mid[\s-]*1|mid[\s-]*i\b|sess+ional/.test(n)) return "Sessional I";
  if (/\bmid/.test(n)) return "Mid";
  if (/final/.test(n)) return "Final";
  if (/quiz/.test(n)) return "Quiz";
  if (/assignment/.test(n)) return "Assignment";
  return "Other";
}

function termOf(name: string): { term: string | null; year: number | null } {
  const m = name.match(/(fall|spring|summer)[\s-]*'?(\d{4}|\d{2})\b/i);
  if (m) {
    const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
    const season = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    return { term: `${season} ${year}`, year };
  }
  // "F2024", "SP26", "s2025", "FA23"
  const code = name.match(/(?:^|[\s_(-])(F|FA|SP|S|SU)[\s-]?(\d{4}|\d{2})(?=$|[\s_)-])/i);
  if (code) {
    const year = code[2].length === 2 ? 2000 + Number(code[2]) : Number(code[2]);
    const c = code[1].toUpperCase();
    const season = c.startsWith("F") ? "Fall" : c === "SU" ? "Summer" : "Spring";
    return { term: `${season} ${year}`, year };
  }
  // "22F", "24S", "26S"
  const short = name.match(/\b(\d{2})([FSU])\b/);
  if (short) {
    const year = 2000 + Number(short[1]);
    const season = short[2] === "F" ? "Fall" : short[2] === "S" ? "Spring" : "Summer";
    return { term: `${season} ${year}`, year };
  }
  const y = name.match(/\b(20\d{2})\b/);
  return { term: y ? y[1] : null, year: y ? Number(y[1]) : null };
}

const SEASON_ORDER: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };

function parse(path: string, branch: string): PastPaper | null {
  const parts = path.split("/");
  const outline = parts[0] === "Course Outlines";
  if (!outline && !/^semester-\d/i.test(parts[0])) return null;
  const file = parts[parts.length - 1];
  if (!FILE_TYPES.test(file) || /^readme/i.test(file)) return null;
  const semesterPart = outline ? parts[1] : parts[0];
  const folder = outline ? parts[2] : parts[1];
  if (!folder) return null;
  const sem = semesterPart.match(/(\d)/);
  const ext = (file.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  const name = file.replace(/\.[a-z0-9]+$/i, "");
  const { term, year } = termOf(name);
  const encoded = parts.map(encodeURIComponent).join("/");
  return {
    path,
    name,
    folder,
    semester: sem ? Number(sem[1]) : null,
    courseCode: FOLDER_TO_CODE[folder.toLowerCase()] ?? null,
    kind: kindOf(name, outline),
    term,
    year,
    solution: /solution|solved|key\b/i.test(name),
    lab: /\blab\b|-lab/i.test(folder) || /\blab\b/i.test(name),
    ext,
    viewUrl: `${PAST_PAPER_REPO_URL}/blob/${branch}/${encoded}`,
    downloadUrl: `${PAST_PAPER_REPO_URL}/raw/${branch}/${encoded}`,
  };
}

async function loadPaths(): Promise<{ branch: string; paths: string[] }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${PAST_PAPER_REPO}/git/trees/${snapshot.branch}?recursive=1`,
      {
        headers: { accept: "application/vnd.github+json", "user-agent": "sabaq-past-papers" },
        next: { revalidate: 60 * 60 * 24 },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error(String(response.status));
    const json = (await response.json()) as { tree?: { path: string; type: string }[] };
    const paths = (json.tree ?? []).filter((t) => t.type === "blob").map((t) => t.path);
    if (paths.length > 0) return { branch: snapshot.branch, paths };
  } catch {
    // GitHub unreachable or rate-limited: use the copy of the file list made at build time.
  }
  return snapshot;
}

function sortPapers(a: PastPaper, b: PastPaper) {
  const y = (b.year ?? 0) - (a.year ?? 0);
  if (y) return y;
  const sa = SEASON_ORDER[a.term?.split(" ")[0] ?? ""] ?? 0;
  const sb = SEASON_ORDER[b.term?.split(" ")[0] ?? ""] ?? 0;
  if (sb !== sa) return sb - sa;
  return a.name.localeCompare(b.name);
}

export async function listPastPapers(): Promise<PastPaper[]> {
  const { branch, paths } = await loadPaths();
  return paths
    .map((p) => parse(p, branch))
    .filter((p): p is PastPaper => p !== null)
    .sort(sortPapers);
}

export async function pastPapersForCourse(code: string): Promise<PastPaper[]> {
  const all = await listPastPapers();
  return all.filter((p) => p.courseCode === code.toUpperCase());
}

/** How many archive papers each course code has, for badges. */
export async function pastPaperCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const p of await listPastPapers()) {
    if (!p.courseCode || p.kind === "Course outline") continue;
    counts.set(p.courseCode, (counts.get(p.courseCode) ?? 0) + 1);
  }
  return counts;
}

export const KIND_ORDER: PastPaperKind[] = [
  "Final",
  "Mid",
  "Sessional II",
  "Sessional I",
  "Quiz",
  "Assignment",
  "Other",
  "Course outline",
];
