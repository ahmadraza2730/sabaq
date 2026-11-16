"use client";

import { useState } from "react";
import { askAssistant, type AssistantResult } from "@/app/actions";

type Exchange = { question: string; result: AssistantResult };

export function AskForm({
  courseId,
  courseCode,
}: {
  courseId: string;
  courseCode: string;
}) {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const question = String(new FormData(form).get("question") ?? "").trim();
    if (!question) return;

    setPending(true);
    const result = await askAssistant(courseId, question);
    setPending(false);
    setHistory((h) => [{ question, result }, ...h]);
    if (result.ok) form.reset();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Your question
          <textarea
            name="question"
            required
            minLength={5}
            maxLength={500}
            rows={3}
            placeholder={`Such as: What is the difference between a stack and a queue? (${courseCode})`}
            className="field"
          />
        </label>
        <div>
          <button className="btn" disabled={pending}>
            {pending ? "Reading the notes…" : "Ask"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-8 grid gap-8">
        {history.map((exchange, i) => (
          <section key={history.length - i}>
            <h2 className="font-semibold">{exchange.question}</h2>
            {exchange.result.ok ? (
              <>
                <div className="mt-2 grid gap-3 whitespace-pre-line leading-relaxed">
                  {exchange.result.answer
                    .split(/\n{2,}/)
                    .map((paragraph, j) => (
                      <p key={j}>{paragraph}</p>
                    ))}
                </div>
                {exchange.result.sources.length > 0 && (
                  <div className="mt-3 text-sm text-ink-soft">
                    <p className="font-medium text-ink">Excerpts used</p>
                    <ol className="mt-1 grid gap-0.5">
                      {exchange.result.sources.map((source) => (
                        <li key={source.number}>
                          [{source.number}]{" "}
                          <a
                            href={`/r/${source.resourceId}`}
                            className="underline"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <p
                role="alert"
                className="mt-2 rounded border border-margin bg-sheet p-3 text-sm"
              >
                {exchange.result.error}
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
