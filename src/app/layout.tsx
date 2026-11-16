import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { isConfigured } from "@/lib/config";
import { getSession } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sabaq: notes and past papers by course",
    template: "%s | Sabaq",
  },
  description:
    "Notes, past papers, course discussions and team finder for university students in Pakistan.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {!isConfigured && (
          <p className="bg-hi px-4 py-2 text-center text-sm font-medium">
            Preview with sample files. Sign-in and uploads turn on once the
            database is connected.
          </p>
        )}

        <header className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5">
          <Link
            href="/"
            className="font-display text-2xl font-extrabold tracking-tight"
          >
            Sabaq
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium">
            <Link href="/" className="hover:underline">
              Universities
            </Link>
            <Link href="/teams" className="hover:underline">
              Teams
            </Link>
            <Link href="/upload" className="hover:underline">
              Upload
            </Link>
            {session?.profile.role === "admin" && (
              <Link href="/admin" className="hover:underline">
                Review queue
              </Link>
            )}
            {session ? (
              <>
                <Link href="/profile" className="hover:underline">
                  {session.profile.full_name || "Profile"}
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
          </nav>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-ink-soft">
          Sabaq means lesson. Share only your own notes and papers your
          teachers allow to be shared.
        </footer>
      </body>
    </html>
  );
}
