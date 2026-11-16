import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { isConfigured } from "@/lib/config";
import { getSession } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sabaq: FAST notes, past papers and answers by course",
    template: "%s | Sabaq",
  },
  description:
    "Notes, past papers, course discussions and a team finder for FAST-NUCES students, and for students at universities across Pakistan.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const year = new Date().getFullYear();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        {!isConfigured && (
          <p className="bg-hi px-4 py-2 text-center text-sm font-medium">
            Preview with sample files. Sign-in and uploads turn on once the
            database is connected.
          </p>
        )}

        <header className="z-40 sm:sticky sm:top-0 border-b border-rule bg-sheet/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3">
            <Logo />
            <nav
              aria-label="Main"
              className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium"
            >
              <Link href="/u/fast-nuces" className="hover:underline">
                FAST-NUCES
              </Link>
              <Link href="/universities" className="hover:underline">
                Universities
              </Link>
              <Link href="/teams" className="hover:underline">
                Teams
              </Link>
              {session?.profile.role === "admin" && (
                <Link href="/admin" className="hover:underline">
                  Review queue
                </Link>
              )}
              {session ? (
                <>
                  <Link href="/profile" className="hover:underline">
                    {session.profile.full_name.split(" ")[0] || "Profile"}
                  </Link>
                  <form action={signOut}>
                    <button className="cursor-pointer text-ink-soft hover:underline">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="hover:underline">
                  Sign in
                </Link>
              )}
              <Link href="/upload" className="btn py-1.5 text-sm">
                Upload
              </Link>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20">
          {children}
        </main>

        <footer className="border-t border-rule bg-sheet">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-ink-soft">
                Sabaq means lesson. Notes, past papers and answers shared by
                students, sorted by course. Share only your own work, or
                papers your teachers allow to be shared.
              </p>
            </div>
            <nav aria-label="Browse" className="grid content-start gap-2">
              <p className="font-semibold">Browse</p>
              <Link href="/u/fast-nuces" className="text-ink-soft hover:text-ink hover:underline">
                FAST-NUCES courses
              </Link>
              <Link href="/universities" className="text-ink-soft hover:text-ink hover:underline">
                All universities
              </Link>
              <Link href="/teams" className="text-ink-soft hover:text-ink hover:underline">
                Team finder
              </Link>
              <Link href="/upload" className="text-ink-soft hover:text-ink hover:underline">
                Upload a file
              </Link>
            </nav>
            <nav aria-label="Project" className="grid content-start gap-2">
              <p className="font-semibold">Project</p>
              <a
                href="https://github.com/ahmadraza2730/sabaq"
                className="text-ink-soft hover:text-ink hover:underline"
              >
                Source code on GitHub
              </a>
              <Link href="/profile" className="text-ink-soft hover:text-ink hover:underline">
                Your profile
              </Link>
            </nav>
          </div>
          <div className="border-t border-rule">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm">
              <p className="text-ink-soft">© {year} Sabaq</p>
              <p>
                Made by{" "}
                <a
                  href="https://github.com/ahmadraza2730"
                  className="font-semibold underline decoration-margin decoration-2 underline-offset-4"
                >
                  Muhammad Ahmad
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
