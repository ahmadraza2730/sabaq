import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl pt-10 leading-relaxed">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Terms of use</h1>
      <p className="mt-2 text-sm text-ink-soft">Last updated 18 November 2026</p>
      <ol className="mt-6 grid list-decimal gap-3 pl-5">
        <li>Sabaq is a free, student-made study site. It is not run by or connected to FAST-NUCES.</li>
        <li>Upload only your own work, or material your teacher allows to be shared. Material that breaks copyright or university rules is removed.</li>
        <li>Use the study assistant and practice problems to learn. Submitting their output as your own graded work may break FAST&apos;s academic integrity rules; that is your responsibility.</li>
        <li>Be respectful in discussions and team posts. Harassment, spam and cheating requests are removed and can get an account closed.</li>
        <li>Do not use the compiler to attack other systems or to run anything other than your own study programs.</li>
        <li>
          Connecting Google Classroom and Calendar is optional and covered by the{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </li>
        <li>Sabaq is provided as is, without guarantees. Always check due dates in Classroom itself.</li>
        <li>
          Questions: <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
        </li>
      </ol>
    </article>
  );
}
