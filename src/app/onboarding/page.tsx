import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { saveFastProfile } from "@/app/actions";
import { ErrorNote, one } from "@/components/ErrorNote";
import { RollField } from "@/components/RollField";
import { PROGRAMS, PROGRAM_CODES } from "@/lib/fast";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage({
  searchParams,
}: PageProps<"/onboarding">) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fonboarding");

  const profile = session.profile;
  const next = one(query.next) || "/";
  const editing = Boolean(profile.roll_number);

  return (
    <div className="mx-auto max-w-lg pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {editing ? "Your FAST details" : "Set up your profile"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {editing
          ? "Update these when you move to a new semester or section."
          : "Sabaq uses these to open your program's roadmap, show your semester's courses first, and sort your work."}
      </p>

      <ErrorNote message={one(query.error)} />

      <form action={saveFastProfile} className="sheet sheet-tight mt-6 grid gap-5 p-6 pl-7">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-1 text-sm font-medium">
          Full name
          <input
            name="full_name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profile.full_name}
            autoComplete="name"
            className="field"
          />
        </label>

        <RollField defaultValue={profile.roll_number ?? ""} />

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Degree program</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROGRAM_CODES.map((code) => (
              <label
                key={code}
                className="flex cursor-pointer items-center gap-2.5 rounded border border-rule bg-sheet px-3 py-2.5 text-sm has-[:checked]:border-ink has-[:checked]:font-semibold"
              >
                <input
                  type="radio"
                  name="program"
                  value={code}
                  required
                  defaultChecked={profile.program === code}
                  className="accent-[var(--color-ink)]"
                />
                {PROGRAMS[code]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Current semester
            <select
              name="current_semester"
              required
              defaultValue={profile.current_semester ?? ""}
              className="field"
            >
              <option value="" disabled>
                Choose
              </option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  Semester {n}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Section
            <input
              name="section"
              required
              maxLength={2}
              pattern="[A-Za-z]{1,2}"
              defaultValue={profile.section ?? ""}
              placeholder="A"
              autoCapitalize="characters"
              className="field uppercase"
            />
          </label>
        </div>

        <div>
          <button className="btn">{editing ? "Save changes" : "Save and continue"}</button>
        </div>
      </form>
    </div>
  );
}
