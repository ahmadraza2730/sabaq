"use client";

import { useState } from "react";
import { askAssistant, type AssistantResult } from "@/app/actions";

type Exchange = { id: number; question: string; result: AssistantResult };

/**
 * Ask the study assistant. Pass courseId for one course, or courses to let
 * the student pick a course or ask across all of them.
 */
export function AskForm({
  courseId,
  courses,
  placeholder = "Such as: What is the difference between a stack and a queue?",
}: {
  courseId?: string;
  courses?: { id: string; label: string }[];
  placeholder?: string;
}) {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const question = String(data.get("question") ?? "").trim();
    if (!question) return;
    const chosen = courseId ?? (String(data.get("course") ?? "") || null);

    setPending(true);
    let result: AssistantResult;
    try {
      result = await askAssistant(chosen, question);
    } catch {
      result = { ok: false, error: "Could not reach the assistant. Check your connection and try again." };
    }
    setPending(false);
    setHistory((h) => [{ id: Date.now(), question, result }, ...h]);
    if (result.ok) (form.elements.namedItem("question") as HTMLTextAreaElement).value = "";
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        {courses && (
          <label className="grid gap-1 text-sm font-medium sm:max-w-md">
            Course
            <select name="course" defaultValue="" className="field">
              <option value="">All FAST-NUCES courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1 text-sm font-medium">
          Your question
          <textarea
            name="question"
            required
            minLength={5}
            maxLength={1000}
            rows={4}
            placeholder={placeholder}
            className="field"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>
        <div className="flex items-center gap-3">
          <button className="btn" disabled={pending}>
            {pending ? "Thinking…" : "Ask"}
          </button>
          <span className="hidden text-xs text-ink-soft sm:inline">
            Ctrl+Enter to send
          </span>
        </div>
      </form>

      <div aria-live="polite" className="mt-8 grid gap-6">
        {pending && (
          <div className="sheet sheet-tight p-5 pl-6" aria-hidden="true">
            <div className="h-3 w-2/3 rounded bg-rule motion-safe:animate-pulse" />
            <div className="mt-3 h-3 w-1/2 rounded bg-rule motion-safe:animate-pulse" />
          </div>
        )}
        {history.map((exchange) => (
          <section key={exchange.id} className="sheet sheet-tight p-5 pl-6">
            <h2 className="font-semibold">{exchange.question}</h2>
            {exchange.result.ok ? (
              <>
                {!exchange.result.fromNotes && (
                  <p className="mt-2 inline-block rounded bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">
                    General answer, not from uploaded notes
                  </p>
                )}
                <div className="mt-3 grid gap-3 whitespace-pre-line leading-relaxed">
                  {exchange.result.answer.split(/\n{2,}/).map((paragraph, j) => (
                    <p key={j}>{paragraph}</p>
                  ))}
                </div>
                {exchange.result.sources.length > 0 && (
                  <div className="mt-4 border-t border-rule pt-3 text-sm text-ink-soft">
                    <p className="font-medium text-ink">Excerpts used</p>
                    <ol className="mt-1 grid gap-0.5">
                      {exchange.result.sources.map((source) => (
                        <li key={source.number}>
                          [{source.number}]{" "}
                          <a href={`/r/${source.resourceId}`} className="underline">
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <p role="alert" className="mt-2 rounded border border-margin p-3 text-sm">
                {exchange.result.error}
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
