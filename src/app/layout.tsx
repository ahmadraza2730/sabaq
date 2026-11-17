import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUTHOR_GITHUB, AUTHOR_LINKEDIN, isConfigured } from "@/lib/config";
import { countDueSoon } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sabaq: FAST notes, past papers and answers by course",
    template: "%s | Sabaq",
  },
  description:
    "Notes, past papers, a study assistant, assignment reminders with Google Classroom sync, and a team finder for FAST-NUCES BS CS, SE, AI, DS and Cyber Security students.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfefd" },
    { media: "(prefers-color-scheme: dark)", color: "#151f33" },
  ],
};

// Runs before the page paints, so a dark-mode reader never sees a white flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const dueSoon = session ? await countDueSoon(session.userId) : 0;
  const year = new Date().getFullYear();

  const links = [
    { href: "/u/fast-nuces", label: "Courses" },
    { href: "/assistant", label: "Assistant" },
    {
      href: "/tasks",
      label: dueSoon > 0 ? `My work (${dueSoon} due)` : "My work",
    },
    { href: "/teams", label: "Teams" },
  ];
  const accountLinks = [
    ...(session?.profile.role === "admin" ? [{ href: "/admin", label: "Review queue" }] : []),
    session
      ? { href: "/profile", label: session.profile.full_name.split(" ")[0] || "Profile" }
      : { href: "/login", label: "Sign in" },
  ];

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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

        <header className="sticky top-0 z-40 border-b border-rule bg-sheet">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
            <Logo />
            <div className="flex items-center gap-2 md:gap-5">
              <nav
                aria-label="Main"
                className="hidden items-center gap-5 text-sm font-medium md:flex"
              >
                {[...links, ...accountLinks].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      link.href === "/tasks" && dueSoon > 0
                        ? "font-semibold text-margin hover:underline"
                        : "hover:underline"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
                {session && (
                  <form action={signOut}>
                    <button className="cursor-pointer text-ink-soft hover:underline">
                      Sign out
                    </button>
                  </form>
                )}
              </nav>
              <ThemeToggle />
              <Link href="/upload" className="btn h-9 px-3 py-0 text-sm">
                Upload
              </Link>
              <MobileMenu items={[...links, ...accountLinks]} signedIn={Boolean(session)} />
            </div>
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
              <Link href="/assistant" className="text-ink-soft hover:text-ink hover:underline">
                Study assistant
              </Link>
              <Link href="/tasks" className="text-ink-soft hover:text-ink hover:underline">
                My work
              </Link>
              <Link href="/teams" className="text-ink-soft hover:text-ink hover:underline">
                Team finder
              </Link>
            </nav>
            <nav aria-label="Project" className="grid content-start gap-2">
              <p className="font-semibold">Project</p>
              <Link href="/upload" className="text-ink-soft hover:text-ink hover:underline">
                Upload a file
              </Link>
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
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-sm">
              <p className="text-ink-soft">© {year} Sabaq</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Made by{" "}
                  <span className="font-semibold underline decoration-margin decoration-2 underline-offset-4">
                    Muhammad Ahmad
                  </span>
                </span>
                {AUTHOR_LINKEDIN && (
                  <a
                    href={AUTHOR_LINKEDIN}
                    rel="noopener noreferrer"
                    className="text-ink-soft hover:text-ink hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
                <a
                  href={AUTHOR_GITHUB}
                  rel="noopener noreferrer"
                  className="text-ink-soft hover:text-ink hover:underline"
                >
                  GitHub
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
