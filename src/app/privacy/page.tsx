import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Sabaq collects, including Google Classroom and Calendar data, and how it is used.",
};

const UPDATED = "18 November 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 font-display text-xl font-bold">{children}</h2>;
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl pt-10 leading-relaxed">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Privacy policy</h1>
      <p className="mt-2 text-sm text-ink-soft">Last updated {UPDATED}</p>

      <p className="mt-6">
        Sabaq (sabaq-black.vercel.app) is a study site for FAST-NUCES students,
        made by Muhammad Ahmad. This page explains what Sabaq stores, why, and
        how to remove it. Questions go to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
      </p>

      <H>What you give Sabaq</H>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5">
        <li>Your account: email address and password (the password is stored hashed by our database provider, Supabase).</li>
        <li>Your FAST profile: name, roll number, program, semester and section.</li>
        <li>Files, questions, answers and team posts you choose to publish. These are visible to other students.</li>
        <li>Reminders you add to My work, and code you submit on the practice pages.</li>
        <li>Questions you ask the study assistant. They are sent to Google&apos;s Gemini API to produce an answer.</li>
      </ul>

      <H>Google Classroom and Google Calendar</H>
      <p className="mt-2">
        Connecting Google is optional. When you click &ldquo;Connect Google
        Classroom&rdquo; on My work, Google asks you to allow Sabaq to:
      </p>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5">
        <li><strong>See your Google Classroom classes</strong> (classroom.courses.readonly), to know which classes to check.</li>
        <li><strong>See your coursework and its status</strong> (classroom.coursework.me.readonly), to list your assignments, their due dates, and whether you have turned them in.</li>
        <li><strong>Create and edit events in your calendar</strong> (calendar.events), to put each open assignment&apos;s due date in your Google Calendar with reminders, and to remove it when you finish or delete the task.</li>
        <li>See your Google email address, to show which account is connected.</li>
      </ul>
      <p className="mt-3">
        From Classroom, Sabaq saves only each assignment&apos;s title, description,
        class name, due date, link and whether it is turned in, into your private
        task list. Sabaq never submits, edits or deletes anything in Classroom, and
        it only touches calendar events it created itself. Sabaq stores the
        access token Google issues for your account so that Sync now works; it is
        readable only by your own account.
      </p>
      <p className="mt-3 rounded bg-hi p-3">
        Sabaq&apos;s use and transfer to any other app of information received from
        Google APIs will adhere to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          className="underline"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
      <p className="mt-3">In line with Limited Use, Google user data is:</p>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5">
        <li>used only to show you your own assignments and add their due dates to your calendar;</li>
        <li>never sold, never used for advertising, and never shared with anyone else, including other Sabaq users;</li>
        <li>never used to train AI models, and never sent to the study assistant;</li>
        <li>never read by people, except with your permission to fix a problem, for security, or where the law requires it.</li>
      </ul>

      <H>Who processes data for Sabaq</H>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5">
        <li>Supabase stores the database and uploaded files.</li>
        <li>Vercel hosts the website.</li>
        <li>Google Gemini answers study assistant questions.</li>
        <li>Compiler Explorer (godbolt.org) compiles and runs code you submit on the practice and compiler pages.</li>
      </ul>

      <H>Removing your data</H>
      <ul className="mt-2 grid list-disc gap-1.5 pl-5">
        <li>
          <strong>Disconnect Google</strong> on <Link href="/tasks" className="underline">My work</Link>.
          Sabaq revokes its access with Google and deletes the stored token. You can
          also remove Sabaq at{" "}
          <a href="https://myaccount.google.com/permissions" className="underline" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>.
        </li>
        <li>Delete any reminder, or tick it done, and its calendar event is removed.</li>
        <li>
          To delete your whole account and everything in it, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>{" "}
          from the address you signed up with. It is done within 7 days.
        </li>
      </ul>

      <H>Cookies</H>
      <p className="mt-2">
        Sabaq uses cookies only to keep you signed in and to protect the Google
        sign-in step. Your browser also stores your light or dark choice and
        unsaved code drafts. There are no advertising or tracking cookies.
      </p>

      <H>Changes</H>
      <p className="mt-2">
        If this policy changes in a way that affects Google data, the date above
        changes and connected students are told on My work before it applies.
      </p>
    </article>
  );
}
