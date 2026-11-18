import "server-only";

// Compiles and runs student code on Compiler Explorer (godbolt.org), which
// sandboxes execution and enforces its own time and memory limits.

export type Language = "cpp" | "java";
export const LANGUAGES: Record<Language, string> = { cpp: "C++ 17 (GCC)", java: "Java 21" };

const COMPILER: Record<Language, { id: string; lang: string; args: string }> = {
  cpp: { id: process.env.RUNNER_CPP_COMPILER || "g132", lang: "c++", args: "-O2 -std=c++17" },
  java: { id: process.env.RUNNER_JAVA_COMPILER || "java2100", lang: "java", args: "" },
};

export type RunResult = {
  ok: boolean; // compiled and exited with code 0
  compileError: string | null;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  timeMs: number | null;
};

export function isLanguage(value: unknown): value is Language {
  return value === "cpp" || value === "java";
}

// Compiler Explorer saves Java as example.java, so a top-level public class
// would not compile. Dropping "public" from class/interface/enum declarations
// keeps the program the same.
function prepare(language: Language, code: string) {
  if (language !== "java") return code;
  return code.replace(/\bpublic\s+((?:final\s+|abstract\s+)*)(class|interface|enum|record)\b/g, "$1$2");
}

type Line = { text: string };

export async function runCode(language: Language, code: string, stdin: string): Promise<RunResult> {
  const compiler = COMPILER[language];
  const response = await fetch(`https://godbolt.org/api/compiler/${compiler.id}/compile`, {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "Sabaq student practice (https://github.com/ahmadraza2730/sabaq)",
    },
    body: JSON.stringify({
      source: prepare(language, code),
      lang: compiler.lang,
      allowStoreCodeDebug: false,
      options: {
        userArguments: compiler.args,
        executeParameters: { args: [], stdin },
        compilerOptions: { executorRequest: true },
        filters: { execute: true },
        tools: [],
        libraries: [],
      },
    }),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "The compiler service is busy. Wait a few seconds and run again."
        : `The compiler service did not answer (${response.status}). Try again in a minute.`,
    );
  }
  const json = (await response.json()) as {
    code?: number;
    didExecute?: boolean;
    timedOut?: boolean;
    stdout?: Line[];
    stderr?: Line[];
    execTime?: string | number;
    buildResult?: { code?: number; stderr?: Line[]; stdout?: Line[] };
  };
  const join = (lines?: Line[]) => (lines ?? []).map((l) => l.text).join("\n");
  const fixNames = (s: string) => s.replaceAll("<source>", language === "java" ? "Main.java" : "main.cpp");

  if (!json.didExecute) {
    const build = json.buildResult;
    const message = join(build?.stderr) || join(build?.stdout) || join(json.stderr) || "Compilation failed.";
    return {
      ok: false,
      compileError: fixNames(message),
      stdout: "",
      stderr: "",
      exitCode: null,
      timedOut: false,
      timeMs: null,
    };
  }

  const stderr = fixNames(join(json.stderr));
  const timedOut = Boolean(json.timedOut) || /processing time exceeded/i.test(stderr);
  const time = Number(json.execTime);
  return {
    ok: json.code === 0 && !timedOut,
    compileError: null,
    stdout: join(json.stdout),
    stderr,
    exitCode: json.code ?? null,
    timedOut,
    timeMs: Number.isFinite(time) ? time : null,
  };
}

/** Compare outputs line by line, ignoring trailing spaces and blank lines at the end. */
export function compareOutput(actual: string, expected: string) {
  const clean = (s: string) =>
    s.replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).join("\n").replace(/\n+$/, "").split("\n");
  const a = clean(actual);
  const e = clean(expected);
  let passed = 0;
  let firstWrong: { line: number; expected: string; got: string } | null = null;
  for (let i = 0; i < e.length; i++) {
    if (a[i] === e[i]) passed++;
    else if (!firstWrong) firstWrong = { line: i + 1, expected: e[i], got: a[i] ?? "(nothing)" };
  }
  return { passed, total: e.length, allPassed: passed === e.length && a.length === e.length, firstWrong };
}
