"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";

type Lang = "cpp" | "java";
const LANG_NAMES: Record<Lang, string> = { cpp: "C++ 17", java: "Java 21" };

type Result = {
  error?: string;
  compileError?: string | null;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  timedOut?: boolean;
  timeMs?: number | null;
  verdict?: "accepted" | "wrong-answer" | "runtime-error" | "time-limit" | "compile-error" | null;
  passed?: number;
  total?: number;
  firstWrong?: { line: number; expected?: string; got?: string } | null;
  solved?: boolean;
  mode: "run" | "submit";
  usedSample: boolean;
};

const VERDICT: Record<string, { text: string; good: boolean }> = {
  accepted: { text: "Accepted", good: true },
  "wrong-answer": { text: "Wrong answer", good: false },
  "runtime-error": { text: "Runtime error", good: false },
  "time-limit": { text: "Time limit exceeded", good: false },
  "compile-error": { text: "Compilation error", good: false },
};

function load(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be full or blocked; drafts are a convenience only.
  }
}

export function CodeRunner({
  storageKey,
  starter,
  problem,
  sampleInput,
  signedIn,
  defaultStdin = "",
  nextPath,
}: {
  storageKey: string;
  starter: Record<Lang, string>;
  problem?: string;
  sampleInput?: string;
  signedIn: boolean;
  defaultStdin?: string;
  nextPath: string;
}) {
  const [language, setLanguage] = useState<Lang>("cpp");
  const [code, setCode] = useState<Record<Lang, string>>(starter);
  const [stdin, setStdin] = useState(defaultStdin);
  const [customInput, setCustomInput] = useState(!problem);
  const [pending, setPending] = useState<null | "run" | "submit">(null);
  const [result, setResult] = useState<Result | null>(null);
  const loaded = useRef(false);

  // Restore the last language and any drafts once, after hydration.
  useEffect(() => {
    const lang = load(`sabaq:lang`);
    const drafts = {
      cpp: load(`sabaq:code:${storageKey}:cpp`) ?? starter.cpp,
      java: load(`sabaq:code:${storageKey}:java`) ?? starter.java,
    };
    setCode(drafts);
    if (lang === "cpp" || lang === "java") setLanguage(lang);
    loaded.current = true;
  }, [storageKey, starter]);

  const onCodeChange = useCallback(
    (value: string) => {
      setCode((c) => ({ ...c, [language]: value }));
      if (loaded.current) save(`sabaq:code:${storageKey}:${language}`, value);
    },
    [language, storageKey],
  );

  function pickLanguage(lang: Lang) {
    setLanguage(lang);
    save("sabaq:lang", lang);
  }

  function reset() {
    if (!window.confirm(`Replace your ${LANG_NAMES[language]} code with the starter code?`)) return;
    setCode((c) => ({ ...c, [language]: starter[language] }));
    save(`sabaq:code:${storageKey}:${language}`, starter[language]);
  }

  async function execute(mode: "run" | "submit") {
    if (pending || !signedIn) return;
    setPending(mode);
    const usedSample = Boolean(problem) && mode === "run" && !customInput;
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          code: code[language],
          problem,
          mode,
          stdin: problem && (mode === "submit" || !customInput) ? undefined : stdin,
        }),
      });
      const json = (await response.json()) as Omit<Result, "mode" | "usedSample">;
      setResult({ ...json, mode, usedSample });
    } catch {
      setResult({ error: "Could not reach the compiler. Check your connection and try again.", mode, usedSample });
    }
    setPending(null);
  }

  const runRef = useRef(execute);
  runRef.current = execute;
  const runShortcut = useCallback(() => runRef.current("run"), []);

  const verdict = result?.verdict ? VERDICT[result.verdict] : null;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Language" className="flex overflow-hidden rounded border border-rule">
          {(Object.keys(LANG_NAMES) as Lang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => pickLanguage(lang)}
              aria-pressed={language === lang}
              className={`cursor-pointer px-3 py-1.5 text-sm font-semibold ${
                language === lang ? "bg-ink text-sheet" : "bg-sheet hover:bg-paper"
              }`}
            >
              {LANG_NAMES[lang]}
            </button>
          ))}
        </div>
        <button type="button" onClick={reset} className="btn btn-quiet h-9 px-3 py-0 text-sm">
          Reset code
        </button>
        <span className="ml-auto hidden text-xs text-ink-soft sm:inline">Ctrl + Enter runs</span>
      </div>

      <div className="h-[26rem] overflow-hidden rounded border border-rule sm:h-[30rem]">
        <CodeEditor
          value={code[language]}
          language={language}
          onChange={onCodeChange}
          onRun={runShortcut}
          label={`${LANG_NAMES[language]} code`}
        />
      </div>

      {problem && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={customInput}
            onChange={(e) => {
              setCustomInput(e.target.checked);
              if (e.target.checked && !stdin && sampleInput) setStdin(sampleInput);
            }}
          />
          Run with my own input instead of the sample
        </label>
      )}
      {customInput && (
        <label className="grid gap-1 text-sm font-medium">
          Input
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={4}
            spellCheck={false}
            className="field font-mono text-sm"
            placeholder="What your program reads from cin / Scanner"
          />
        </label>
      )}

      {signedIn ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => execute("run")} disabled={pending !== null} className="btn">
            {pending === "run" ? "Running…" : "Run"}
          </button>
          {problem && (
            <button
              type="button"
              onClick={() => execute("submit")}
              disabled={pending !== null}
              className="btn btn-quiet"
            >
              {pending === "submit" ? "Checking all tests…" : "Submit"}
            </button>
          )}
        </div>
      ) : (
        <p className="rounded bg-hi p-3 text-sm">
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold underline">
            Sign in
          </Link>{" "}
          to run your code. Your code is saved in this browser while you write.
        </p>
      )}

      <div aria-live="polite">
        {result && (
          <section className="sheet sheet-tight p-4 pl-6 text-sm">
            {result.error ? (
              <p className="font-semibold text-margin">{result.error}</p>
            ) : (
              <>
                {verdict && (
                  <p className={`font-display text-lg font-bold ${verdict.good ? "text-ok" : "text-margin"}`}>
                    {verdict.text}
                    {result.total !== undefined && result.verdict !== "compile-error" && (
                      <span className="ml-2 text-sm font-normal text-ink-soft">
                        {result.passed} of {result.total} {result.mode === "submit" ? "tests" : "sample cases"} passed
                      </span>
                    )}
                  </p>
                )}
                {result.solved && (
                  <p className="mt-1 font-medium text-ok">Solved. It now shows a tick on the practice list.</p>
                )}
                {result.compileError && (
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-paper p-3 font-mono text-xs">
                    {result.compileError}
                  </pre>
                )}
                {result.firstWrong && result.mode === "run" && result.firstWrong.expected !== undefined && (
                  <div className="mt-2 grid gap-1 font-mono text-xs">
                    <p>
                      <span className="font-sans text-ink-soft">Line {result.firstWrong.line}, expected: </span>
                      {result.firstWrong.expected}
                    </p>
                    <p>
                      <span className="font-sans text-ink-soft">Your output: </span>
                      {result.firstWrong.got}
                    </p>
                  </div>
                )}
                {result.firstWrong && result.mode === "submit" && (
                  <p className="mt-1 text-ink-soft">
                    The first wrong answer is on test case {result.firstWrong.line}. Check edge
                    cases: smallest and largest values, negatives, repeats.
                  </p>
                )}
                {result.timedOut && (
                  <p className="mt-1 text-ink-soft">
                    Your program ran too long. Look for an endless loop, or a faster algorithm.
                  </p>
                )}
                {!result.compileError && result.mode === "run" && (
                  <>
                    <p className="mt-3 font-semibold">
                      Output{" "}
                      <span className="font-normal text-ink-soft">
                        {result.usedSample ? "(sample input)" : ""}
                        {result.timeMs !== null && result.timeMs !== undefined ? ` · ${result.timeMs} ms` : ""}
                        {result.exitCode ? ` · exit code ${result.exitCode}` : ""}
                      </span>
                    </p>
                    <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-paper p-3 font-mono text-xs">
                      {result.stdout || "(no output)"}
                    </pre>
                  </>
                )}
                {result.stderr && !result.timedOut && (
                  <>
                    <p className="mt-3 font-semibold">Errors</p>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-paper p-3 font-mono text-xs text-margin">
                      {result.stderr}
                    </pre>
                  </>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
