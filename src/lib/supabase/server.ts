import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { isConfigured, supabaseKey, supabaseUrl } from "@/lib/config";
import type { Profile } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export type Session = {
  userId: string;
  email: string;
  profile: Profile;
  /** Slug of the university the student picked on their profile, if any. */
  universitySlug: string | null;
};

/** The signed-in student and their profile, or null. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!isConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, batch, campus_id, role, roll_number, program, section, current_semester, campuses(universities(slug))",
    )
    .eq("id", user.id)
    .maybeSingle();

  const row = data as
    | (Profile & {
        campuses: { universities: { slug: string } | null } | null;
      })
    | null;

  const profile: Profile = row
    ? {
        id: row.id,
        full_name: row.full_name,
        batch: row.batch,
        campus_id: row.campus_id,
        role: row.role,
        roll_number: row.roll_number,
        program: row.program,
        section: row.section,
        current_semester: row.current_semester,
      }
    : {
        id: user.id,
        full_name: "",
        batch: null,
        campus_id: null,
        role: "student",
        roll_number: null,
        program: null,
        section: null,
        current_semester: null,
      };

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
    universitySlug: row?.campuses?.universities?.slug ?? null,
  };
});
