import { NextResponse, type NextRequest } from "next/server";
import { getTests } from "@/lib/practice";
import { compareOutput, isLanguage, runCode } from "@/lib/runner";
import { createClient, getSession } from "@/lib/supabase/server";

export const maxDuration = 60;

const RUNS_PER_HOUR = 80;

type Body = {
  language?: unknown;
  code?: unknown;
  stdin?: unknown;
  problem?: unknown;
  mode?: unknown; // "run" (sample or custom input) or "submit" (all tests)
};

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Sign in to run code.", 401);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail("Bad request.");
  }
  const { language, code } = body;
  if (!isLanguage(language)) return fail("Pick C++ or Java.");
  if (typeof code !== "string" || code.trim().length === 0) return fail("Write some code first.");
  if (code.length > 50_000) return fail("That program is too long (50,000 characters at most).");
  const mode = body.mode === "submit" ? "submit" : "run";
  const custom = typeof body.stdin === "string" ? body.stdin : null;
  if (custom && custom.length > 100_000) return fail("That input is too long (100,000 characters at most).");

  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("code_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("created_at", since);
  if ((count ?? 0) >= RUNS_PER_HOUR) {
    return fail(`You have run code ${RUNS_PER_HOUR} times in the last hour. Take a short break and try again.`, 429);
  }
  await supabase.from("code_runs").insert({ user_id: session.userId });

  const slug = typeof body.problem === "string" ? body.problem : null;
  const tests = slug ? getTests(slug) : null;
  if (slug && !tests) return fail("That problem does not exist.", 404);

  // Which input to use, and what (if anything) to compare against.
  let stdin = custom ?? "";
  let expected: string | null = null;
  if (tests && mode === "submit") {
    stdin = tests.tests.input;
    expected = tests.tests.output;
  } else if (tests && custom === null) {
    stdin = tests.sample.input;
    expected = tests.sample.output;
  }

  let result;
  try {
    result = await runCode(language, code, stdin);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Running failed.", 502);
  }

  const shown = {
    compileError: result.compileError,
    // Hidden test output is never sent back in full.
    stdout: mode === "submit" ? "" : result.stdout.slice(0, 20_000),
    stderr: result.stderr.slice(0, 5_000),
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    timeMs: result.timeMs,
  };

  if (expected === null || result.compileError) {
    return NextResponse.json({ ...shown, verdict: result.compileError ? "compile-error" : null });
  }

  const check = compareOutput(result.stdout, expected);
  let verdict: string;
  if (result.timedOut) verdict = "time-limit";
  else if (result.exitCode !== 0) verdict = "runtime-error";
  else verdict = check.allPassed ? "accepted" : "wrong-answer";

  let solved = false;
  if (mode === "submit" && verdict === "accepted" && slug) {
    const { error } = await supabase.from("practice_solved").upsert({
      user_id: session.userId,
      problem_slug: slug,
      language,
      code,
      solved_at: new Date().toISOString(),
    });
    solved = !error;
  }

  return NextResponse.json({
    ...shown,
    verdict,
    passed: check.passed,
    total: check.total,
    // For the sample, show where it went wrong; for hidden tests, only the case number.
    firstWrong:
      mode === "submit"
        ? check.firstWrong && { line: check.firstWrong.line }
        : check.firstWrong,
    solved,
  });
}
