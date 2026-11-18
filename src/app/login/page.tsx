import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, signUp } from "@/app/actions";
import { Reveal } from "@/components/Reveal";
import { Scramble } from "@/components/Scramble";
import { WordCycle } from "@/components/WordCycle";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const mode = one(params.mode) === "signup" ? "signup" : "signin";
  const next = one(params.next) || "/";
  const error = one(params.error);
  const notice = one(params.notice);

  if (await getSession()) redirect("/");

  const switchHref = `/login?mode=${
    mode === "signup" ? "signin" : "signup"
  }&next=${encodeURIComponent(next)}`;

  return (
    <>
      <div className="grid min-h-[calc(100dvh-9rem)] items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="hidden lg:block">
          <p className="font-display text-sm font-bold text-margin">Sabaq, for FAST-NUCES</p>
          <h2 className="mt-3 font-display text-5xl font-extrabold leading-[1.02] tracking-tight">
            <Scramble text="Your semester," />{" "}
            <span className="hi">
              <Scramble text="already half written." delay={250} />
            </span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            Your seniors&apos; <WordCycle words={["notes", "past papers", "slides", "solved labs"]} />,
            your Classroom due dates, and a compiler for PF, OOP and DSA practice, all in one notebook.
          </p>
          <ul className="mt-8 grid max-w-md gap-3 text-sm">
            {[
              ["Section-aware", "Only the Classroom work for your section."],
              ["Slides by subject", "Every deck your teachers posted, sorted for you."],
              ["Practice that runs", "C++ and Java, checked against hidden tests."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3 rounded border border-rule bg-sheet/80 p-3 backdrop-blur-sm">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-margin" />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-ink-soft">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mx-auto w-full max-w-md">
          <div className="sheet sheet-tight p-6 pl-8 shadow-[0_18px_50px_-20px_color-mix(in_srgb,var(--color-ink)_35%,transparent)] sm:p-8 sm:pl-10">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              <Scramble text={mode === "signup" ? "Create your account" : "Welcome back"} delay={150} />
            </h1>
            <p className="mt-2 text-ink-soft">
              {mode === "signup"
                ? "It takes a minute. Your FAST roll number comes next."
                : "Sign in to see what is due and pick up where you left off."}
            </p>

            {error && (
              <p role="alert" className="mt-5 rounded border border-margin bg-sheet p-3 text-sm">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mt-5 rounded bg-hi p-3 text-sm font-medium">
                {notice}
              </p>
            )}

            <form action={mode === "signup" ? signUp : signIn} className="mt-6 grid gap-4">
              <input type="hidden" name="next" value={next} />
              {mode === "signup" && (
                <label className="grid gap-1 text-sm font-medium">
                  Full name
                  <input name="full_name" required autoComplete="name" className="field" />
                </label>
              )}
              <label className="grid gap-1 text-sm font-medium">
                Email
                <input name="email" type="email" required autoComplete="email" className="field" />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="field"
                />
              </label>
              <button className="btn mt-1 py-3">
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 border-t border-rule pt-5 text-sm">
              {mode === "signup" ? "Already have an account? " : "New here? "}
              <Link href={switchHref} className="ink-link font-semibold">
                {mode === "signup" ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
