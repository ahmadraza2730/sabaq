import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { CLASSROOM_SCOPES, googleRedirectUri, isClassroomConfigured } from "@/lib/classroom";
import { getSession } from "@/lib/supabase/server";

// Sends the student to Google to allow read-only Classroom access.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const session = await getSession();
  if (!session) return NextResponse.redirect(`${origin}/login?next=%2Ftasks`);
  if (!isClassroomConfigured()) {
    return NextResponse.redirect(`${origin}/tasks?error=${encodeURIComponent("Classroom connection is not set up on this site yet.")}`);
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: CLASSROOM_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
