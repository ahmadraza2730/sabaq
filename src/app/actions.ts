"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AI_DAILY_LIMIT, answerQuestion, isAssistantEnabled, type Excerpt } from "@/lib/ai";
import { isConfigured } from "@/lib/config";
import { indexResource } from "@/lib/indexing";
import { createClient, getSession } from "@/lib/supabase/server";
import { isResourceType, isTeamKind } from "@/lib/types";

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

/** Send the visitor back to a page with an error message to show. */
function back(path: string, error: string): never {
  const joiner = path.includes("?") ? "&" : "?";
  redirect(`${path}${joiner}error=${encodeURIComponent(error)}`);
}

async function requireSession(path: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);
  return session;
}

// ---------- Accounts ----------

function loginError(message: string, mode: string, next: string): never {
  const params = new URLSearchParams({ error: message, mode, next });
  redirect(`/login?${params}`);
}

export async function signIn(formData: FormData) {
  const next = safeNext(formData.get("next"));
  if (!isConfigured) loginError("Sign-in is not connected yet.", "signin", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) loginError(error.message, "signin", next);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = safeNext(formData.get("next"));
  if (!isConfigured) loginError("Sign-up is not connected yet.", "signup", next);

  const fullName = text(formData, "full_name");
  const batch = text(formData, "batch");
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) loginError("Enter your name.", "signup", next);
  if (password.length < 8)
    loginError("Use a password of at least 8 characters.", "signup", next);

  const headerList = await headers();
  const origin =
    headerList.get("origin") ?? `https://${headerList.get("host") ?? ""}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: text(formData, "email"),
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

export async function updateProfile(formData: FormData) {
  const session = await requireSession("/profile");
  const fullName = text(formData, "full_name");
  if (fullName.length < 2) back("/profile", "Enter your name.");

  const campusId = text(formData, "campus_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName.slice(0, 80),
      batch: text(formData, "batch").slice(0, 20) || null,
      campus_id: campusId || null,
    })
    .eq("id", session.userId);
  if (error) back("/profile", error.message);

  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

// ---------- Files ----------

export async function toggleVote(resourceId: string, path: string) {
  const session = await requireSession(path);
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

  // Make the text searchable for the study assistant. Approval stands
  // even if the file has no readable text.
  if (decision === "approved") {
    try {
      await indexResource(supabase, resourceId);
    } catch (indexError) {
      console.error("Indexing failed", resourceId, indexError);
    }
  }

  revalidatePath("/", "layout");
}

// ---------- Courses ----------

export async function addCourse(universitySlug: string, formData: FormData) {
  const path = `/u/${universitySlug}`;
  const session = await requireSession(path);

  const code = text(formData, "code").toUpperCase().replace(/\s+/g, "-");
  const title = text(formData, "title");
  const semester = Number(text(formData, "semester"));

  if (!/^[A-Z0-9-]{3,12}$/.test(code))
    back(path, "Use the course code as printed, such as CS2001 or CS-212.");
  if (title.length < 3 || title.length > 120)
    back(path, "Give the course a title of 3 to 120 characters.");
  if (!Number.isInteger(semester) || semester < 1 || semester > 8)
    back(path, "Pick the semester the course is usually taken in.");

  const supabase = await createClient();
  const { data: university } = await supabase
    .from("universities")
    .select("id")
    .eq("slug", universitySlug)
    .single();
  if (!university) back(path, "That university does not exist.");

  const { error } = await supabase.from("courses").insert({
    university_id: university.id,
    code,
    title,
    semester,
    added_by: session.userId,
  });
  if (error) {
    back(
      path,
      error.code === "23505"
        ? `${code} is already listed.`
        : `Could not add the course: ${error.message}`,
    );
  }

  revalidatePath(path);
  redirect(`${path}/${code}`);
}

// ---------- Discussion ----------

export async function createThread(
  courseId: string,
  coursePath: string,
  formData: FormData,
) {
  const listPath = `${coursePath}/discuss`;
  const session = await requireSession(listPath);
  const title = text(formData, "title");
  const body = text(formData, "body");

  if (title.length < 5 || title.length > 150)
    back(listPath, "Write a question title of 5 to 150 characters.");
  if (body.length < 1 || body.length > 5000)
    back(listPath, "Add some detail to your question (up to 5000 characters).");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("threads")
    .insert({ course_id: courseId, author_id: session.userId, title, body })
    .select("id")
    .single();
  if (error || !data) back(listPath, `Could not post: ${error?.message}`);

  revalidatePath(listPath);
  redirect(`${listPath}/${data.id}`);
}

export async function createReply(
  threadId: string,
  threadPath: string,
  formData: FormData,
) {
  const session = await requireSession(threadPath);
  const body = text(formData, "body");
  if (body.length < 1 || body.length > 5000)
    back(threadPath, "Write an answer of up to 5000 characters.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("replies")
    .insert({ thread_id: threadId, author_id: session.userId, body });
  if (error) back(threadPath, `Could not post: ${error.message}`);

  revalidatePath(threadPath);
  redirect(`${threadPath}#answers`);
}

export async function deleteThread(threadId: string, listPath: string) {
  await requireSession(listPath);
  const supabase = await createClient();
  // Row level security only lets the author or an admin delete.
  await supabase.from("threads").delete().eq("id", threadId);
  revalidatePath(listPath);
  redirect(listPath);
}

export async function deleteReply(replyId: string, threadPath: string) {
  await requireSession(threadPath);
  const supabase = await createClient();
  await supabase.from("replies").delete().eq("id", replyId);
  revalidatePath(threadPath);
}

// ---------- Team finder ----------

export async function createTeamPost(formData: FormData) {
  const session = await requireSession("/teams");
  const kind = text(formData, "kind");
  const title = text(formData, "title");
  const body = text(formData, "body");
  const contact = text(formData, "contact");
  const universityId = text(formData, "university_id");
  const skills = text(formData, "skills")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 30));

  if (!isTeamKind(kind)) back("/teams", "Choose what kind of team this is.");
  if (title.length < 5 || title.length > 120)
    back("/teams", "Write a title of 5 to 120 characters.");
  if (body.length < 10 || body.length > 3000)
    back("/teams", "Describe the idea and who you need in 10 to 3000 characters.");
  if (contact.length < 3 || contact.length > 200)
    back("/teams", "Add how people should reach you, such as an email or WhatsApp number.");

  const supabase = await createClient();
  const { error } = await supabase.from("team_posts").insert({
    author_id: session.userId,
    university_id: universityId || null,
    kind,
    title,
    body,
    skills,
    contact,
  });
  if (error) back("/teams", `Could not post: ${error.message}`);

  revalidatePath("/teams");
  redirect("/teams");
}

export async function setTeamPostOpen(postId: string, isOpen: boolean) {
  await requireSession("/teams");
  const supabase = await createClient();
  await supabase.from("team_posts").update({ is_open: isOpen }).eq("id", postId);
  revalidatePath("/teams");
}

export async function deleteTeamPost(postId: string) {
  await requireSession("/teams");
  const supabase = await createClient();
  await supabase.from("team_posts").delete().eq("id", postId);
  revalidatePath("/teams");
}

// ---------- Study assistant ----------

export type AssistantResult =
  | {
      ok: true;
      answer: string;
      fromNotes: boolean;
      sources: { number: number; resourceId: string; title: string }[];
    }
  | { ok: false; error: string };

/**
 * Answer a question for one course (courseId) or across every course at a
 * university (courseId null). Uses uploaded notes when they match.
 */
export async function askAssistant(
  courseId: string | null,
  rawQuestion: string,
  universitySlug = "fast-nuces",
): Promise<AssistantResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to use the assistant." };
  if (!isAssistantEnabled())
    return { ok: false, error: "The study assistant is not switched on yet." };

  const question = rawQuestion.trim().slice(0, 1000);
  if (question.length < 5)
    return { ok: false, error: "Write a question of at least a few words." };

  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .gte("created_at", since);
  if ((count ?? 0) >= AI_DAILY_LIMIT) {
    return {
      ok: false,
      error: `You have asked ${AI_DAILY_LIMIT} questions in the last 24 hours. Try again tomorrow.`,
    };
  }

  let context = "";
  let excerpts: Excerpt[] = [];
  if (courseId) {
    const [{ data: course }, { data: matches }] = await Promise.all([
      supabase.from("courses").select("code, title").eq("id", courseId).maybeSingle(),
      supabase.rpc("match_chunks", { cid: courseId, question, n: 6 }),
    ]);
    context = course
      ? `The student is asking about the course ${course.code} ${course.title}.`
      : "";
    excerpts = ((matches ?? []) as { resource_id: string; title: string; content: string }[]).map(
      (m) => ({ resourceId: m.resource_id, title: m.title, content: m.content }),
    );
  } else {
    const { data: matches } = await supabase.rpc("match_chunks_university", {
      uni: universitySlug,
      question,
      n: 6,
    });
    context =
      universitySlug === "fast-nuces"
        ? "The student is at FAST-NUCES (National University of Computer and Emerging Sciences), most likely in BS Computer Science."
        : `The student's university is ${universitySlug}.`;
    excerpts = (
      (matches ?? []) as { resource_id: string; title: string; content: string; course_code: string }[]
    ).map((m) => ({
      resourceId: m.resource_id,
      title: m.title,
      content: m.content,
      courseCode: m.course_code,
    }));
  }

  try {
    const answer = await answerQuestion(question, excerpts, context);
    await supabase
      .from("ai_questions")
      .insert({ user_id: session.userId, course_id: courseId });
    return {
      ok: true,
      answer,
      fromNotes: excerpts.length > 0,
      sources: excerpts.map((e, i) => ({
        number: i + 1,
        resourceId: e.resourceId,
        title: e.courseCode ? `${e.title} (${e.courseCode})` : e.title,
      })),
    };
  } catch (askError) {
    return {
      ok: false,
      error: askError instanceof Error ? askError.message : "The assistant failed.",
    };
  }
}
