import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, syncClassroom } from "@/lib/classroom";
import { createClient, getSession } from "@/lib/supabase/server";

// Google sends the student back here after they allow access.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/tasks?error=${encodeURIComponent(message)}`);

  const session = await getSession();
  if (!session) return NextResponse.redirect(`${origin}/login?next=%2Ftasks`);

  const cookieStore = await cookies();
  const expected = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete({ name: "google_oauth_state", path: "/api/google" });
  if (url.searchParams.get("error")) return fail("Google access was not allowed.");
  if (!expected || expected !== url.searchParams.get("state")) {
    return fail("That Google sign-in link expired. Try connecting again.");
  }

  const code = url.searchParams.get("code");
  if (!code) return fail("Google did not return a sign-in code.");

  try {
    const tokens = await exchangeCode(code, origin);
    if (!tokens.refreshToken) {
      return fail("Google did not grant lasting access. Remove Sabaq from your Google account's third-party access, then connect again.");
    }
    const supabase = await createClient();
    const { error } = await supabase.from("google_connections").upsert({
      user_id: session.userId,
      google_email: tokens.email,
      refresh_token: tokens.refreshToken,
      connected_at: new Date().toISOString(),
      calendar_enabled: tokens.calendar,
    });
    if (error) return fail(`Could not save the connection: ${error.message}`);

    const result = await syncClassroom(supabase, session.userId);
    return NextResponse.redirect(
      `${origin}/tasks?synced=${result.items}&courses=${result.courses}&events=${result.events}`,
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Connecting Classroom failed.");
  }
}
