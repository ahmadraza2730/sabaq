import type { Metadata } from "next";
import Link from "next/link";
import {
  createTeamPost,
  deleteTeamPost,
  setTeamPostOpen,
} from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { isConfigured } from "@/lib/config";
import { listTeamPosts, listUniversities } from "@/lib/data";
import { getSession } from "@/lib/supabase/server";
import { TEAM_KIND_LABELS, formatDate, isTeamKind, type TeamKind } from "@/lib/types";

export const metadata: Metadata = { title: "Team finder" };

export default async function TeamsPage({ searchParams }: PageProps<"/teams">) {
  const query = await searchParams;
  const kind = isTeamKind(query.kind) ? query.kind : undefined;
  const uniSlug = one(query.uni);

  const [universities, session] = await Promise.all([
    listUniversities(),
    getSession(),
  ]);
  const university = universities.find((u) => u.slug === uniSlug);
  const posts = await listTeamPosts({
    kind,
    universityId: university?.id,
    withContact: Boolean(session),
  });

  const myUniversityId = universities.find(
    (u) => u.slug === session?.universitySlug,
  )?.id;
  const kinds = Object.entries(TEAM_KIND_LABELS) as [TeamKind, string][];

  return (
    <>
      <h1 className="pt-8 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Team finder
      </h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Post what you are building and who you need, or find a team that
        needs your skills.
      </p>

      <ErrorNote message={one(query.error)} />

      {session ? (
        <details className="sheet mt-6">
          <summary className="cursor-pointer py-3 pl-8 pr-4 font-semibold sm:pl-[7.25rem]">
            Post a team
          </summary>
          <form
            action={createTeamPost}
            className="grid gap-4 pb-5 pl-8 pr-4 sm:pl-[7.25rem] sm:pr-6"
          >
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium">
                Kind
                <select name="kind" required defaultValue="project" className="field">
                  {kinds.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="university_id" value={myUniversityId ?? universities[0]?.id ?? ""} />
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input
                name="title"
                required
                minLength={5}
                maxLength={120}
                placeholder="Such as: Need a frontend dev for NaSCon hackathon"
                className="field"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Details
              <textarea
                name="body"
                required
                minLength={10}
                maxLength={3000}
                rows={4}
                placeholder="The idea, the deadline, what you have already, and who you need."
                className="field"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Skills wanted (comma separated)
              <input
                name="skills"
                placeholder="React, Figma, Python"
                className="field"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              How to reach you
              <input
                name="contact"
                required
                minLength={3}
                maxLength={200}
                placeholder="Email, WhatsApp number or LinkedIn"
                className="field"
              />
              <span className="font-normal text-ink-soft">
                Only signed-in students can see this.
              </span>
            </label>
            <div>
              <button className="btn">Post team</button>
            </div>
          </form>
        </details>
      ) : (
        <p className="mt-6 text-sm">
          {isConfigured ? (
            <>
              <Link
                href="/login?next=%2Fteams"
                className="font-semibold underline"
              >
                Sign in
              </Link>{" "}
              to post a team and see how to contact people.
            </>
          ) : (
            "Posting turns on once the database is connected."
          )}
        </p>
      )}

      <form
        action="/teams"
        className="mb-4 mt-8 flex flex-wrap items-end gap-3 text-sm"
      >
        <label className="grid gap-1 font-medium">
          Kind
          <select name="kind" defaultValue={kind ?? ""} className="field">
            <option value="">All kinds</option>
            {kinds.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-quiet">Show</button>
      </form>

      <ul className="sheet">
        {posts.length === 0 && (
          <li className="line">
            <span className="in-margin" />
            <span>No teams match yet. Post the first one.</span>
          </li>
        )}
        {posts.map((post) => {
          const mine = session?.userId === post.author_id;
          const isAdmin = session?.profile.role === "admin";
          return (
            <li key={post.id} className={`line ${post.is_open ? "" : "opacity-60"}`}>
              <span className="in-margin text-sm font-semibold text-ink-soft">
                {TEAM_KIND_LABELS[post.kind]}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-medium">{post.title}</span>
                  {!post.is_open && (
                    <span className="text-sm font-semibold text-ink-soft">
                      Team filled
                    </span>
                  )}
                </span>
                <span className="mt-1 block whitespace-pre-line text-sm leading-relaxed">
                  {post.body}
                </span>
                {post.skills.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {post.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-paper px-2 py-0.5 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </span>
                )}
                <span className="mt-2 block text-sm text-ink-soft">
                  {[
                    post.author_name || "A student",
                    post.university_short_name,
                    formatDate(post.created_at),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                <span className="mt-1 block text-sm">
                  {post.contact ? (
                    <>
                      Contact: <span className="font-medium">{post.contact}</span>
                    </>
                  ) : (
                    <span className="text-ink-soft">
                      Sign in to see how to contact them.
                    </span>
                  )}
                </span>
                {(mine || isAdmin) && (
                  <span className="mt-2 flex gap-4 text-sm">
                    {mine && (
                      <form action={setTeamPostOpen.bind(null, post.id, !post.is_open)}>
                        <button className="cursor-pointer underline">
                          {post.is_open ? "Mark as filled" : "Reopen"}
                        </button>
                      </form>
                    )}
                    <form action={deleteTeamPost.bind(null, post.id)}>
                      <button className="cursor-pointer text-ink-soft underline">
                        Delete
                      </button>
                    </form>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
