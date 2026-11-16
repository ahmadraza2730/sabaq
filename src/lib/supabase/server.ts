import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

/** The signed-in student and their profile, or null. */
export async function getSession(): Promise<{
  userId: string;
  email: string;
  profile: Profile;
} | null> {
  if (!isConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, batch, campus_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = (data as Profile | null) ?? {
    id: user.id,
    full_name: "",
    batch: null,
    campus_id: null,
    role: "student",
  };
  return { userId: user.id, email: user.email ?? "", profile };
}
