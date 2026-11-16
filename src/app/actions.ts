"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isConfigured } from "@/lib/config";
import { createClient, getSession } from "@/lib/supabase/server";
import { isResourceType } from "@/lib/types";

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function loginError(message: string, mode: string, next: string) {
  const params = new URLSearchParams({ error: message, mode, next });
  redirect(`/login?${params}`);
}

export async function signIn(formData: FormData) {
  const next = safeNext(formData.get("next"));
  if (!isConfigured) loginError("Sign-in is not connected yet.", "signin", next);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError(error.message, "signin", next);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = safeNext(formData.get("next"));
  if (!isConfigured) loginError("Sign-up is not connected yet.", "signup", next);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const batch = String(formData.get("batch") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) loginError("Enter your name.", "signup", next);
  if (password.length < 8)
    loginError("Use a password of at least 8 characters.", "signup", next);

  const headerList = await headers();
  const origin =
    headerList.get("origin") ?? `https://${headerList.get("host") ?? ""}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, batch },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) loginError(error.message, "signup", next);

  if (!data.session) {
    redirect(
      `/login?notice=${encodeURIComponent(
        "Check your email and open the confirmation link to finish signing up.",
      )}`,
    );
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  if (isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function toggleVote(resourceId: string, path: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("votes")
    .select("resource_id")
    .eq("user_id", session.userId)
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("votes")
      .delete()
      .eq("user_id", session.userId)
      .eq("resource_id", resourceId);
  } else {
    await supabase
      .from("votes")
      .insert({ user_id: session.userId, resource_id: resourceId });
  }
  revalidatePath(path);
}

export type CreateResourceInput = {
  courseId: string;
  title: string;
  type: string;
  year: number | null;
  filePath: string;
  fileName: string;
};

/** Called after the browser has uploaded the file to storage. */
export async function createResource(
  input: CreateResourceInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to upload." };

  const title = input.title.trim();
  if (title.length < 3 || title.length > 120)
    return { ok: false, error: "Give the file a title of 3 to 120 characters." };
  if (!isResourceType(input.type))
    return { ok: false, error: "Choose what kind of file this is." };
  if (!input.filePath.startsWith(`${session.userId}/`))
    return { ok: false, error: "The file was not uploaded to your folder." };

  const supabase = await createClient();
  const { error } = await supabase.from("resources").insert({
    course_id: input.courseId,
    campus_id: session.profile.campus_id,
    uploader_id: session.userId,
    title,
    type: input.type,
    year: input.year,
    file_path: input.filePath,
    file_name: input.fileName.slice(0, 200),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/admin");
  return { ok: true };
}

export async function reviewResource(
  resourceId: string,
  decision: "approved" | "rejected",
) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") redirect("/");

  // Row level security also blocks this for non-admins.
  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .update({ status: decision })
    .eq("id", resourceId);
  if (error) throw new Error(`Could not save the review: ${error.message}`);

  revalidatePath("/", "layout");
}
