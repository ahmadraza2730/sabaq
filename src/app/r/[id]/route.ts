import { NextResponse, type NextRequest } from "next/server";
import { isConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

// Download a file: check access, count the download, redirect to a
// short-lived signed link. Files are never public directly.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { origin } = new URL(request.url);
  if (!isConfigured) return NextResponse.redirect(`${origin}/`);

  const supabase = await createClient();
  // Row level security hides files this visitor may not see.
  const { data: resource } = await supabase
    .from("resources")
    .select("id, file_path, file_name, status")
    .eq("id", id)
    .maybeSingle();
  if (!resource) {
    return new NextResponse("This file does not exist or is not approved yet.", {
      status: 404,
    });
  }

  const { data: signed, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(resource.file_path, 60, { download: resource.file_name });
  if (error || !signed) {
    return new NextResponse("The file could not be opened. Try again.", {
      status: 500,
    });
  }

  if (resource.status === "approved") {
    await supabase.rpc("increment_download", { rid: resource.id });
  }
  return NextResponse.redirect(signed.signedUrl);
}
