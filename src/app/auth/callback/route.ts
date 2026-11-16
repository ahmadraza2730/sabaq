import { NextResponse, type NextRequest } from "next/server";
import { isConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

// The link in the confirmation email lands here with a one-time code.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (isConfigured && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const message = encodeURIComponent(
    "That confirmation link did not work. Sign in, or sign up again for a new link.",
  );
  return NextResponse.redirect(`${origin}/login?error=${message}`);
}
