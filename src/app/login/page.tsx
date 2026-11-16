import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, signUp } from "@/app/actions";
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
    <div className="mx-auto max-w-md pt-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {mode === "signup" ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {mode === "signup"
          ? "An account lets you upload files and upvote the useful ones."
          : "Sign in to upload files and upvote the useful ones."}
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

      <form
        action={mode === "signup" ? signUp : signIn}
        className="mt-6 grid gap-4"
      >
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <>
            <label className="grid gap-1 text-sm font-medium">
              Full name
              <input name="full_name" required autoComplete="name" className="field" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Batch (optional)
              <input name="batch" placeholder="Such as 2025" className="field" />
            </label>
          </>
        )}
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
          />
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
        <button className="btn">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <Link href={switchHref} className="font-semibold underline">
          {mode === "signup" ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
