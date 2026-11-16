import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

const CHUNK_CHARS = 1200;
const OVERLAP_CHARS = 200;
const MAX_CHUNKS = 300;

/** Pull plain text out of a PDF or Word file. Other types return "". */
export async function extractFileText(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (extension === "docx") {
    const { value } = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return value;
  }
  return "";
}

/** Overlapping windows of text, broken at whitespace. */
export function chunkText(raw: string): string[] {
  // Postgres text cannot hold NUL characters.
  const text = raw.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + CHUNK_CHARS, text.length);
    if (end < text.length) {
      const space = text.lastIndexOf(" ", end);
      if (space > start + CHUNK_CHARS / 2) end = space;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 40) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}

/**
 * Store the searchable text of one file so the study assistant can use it.
 * Must run as an admin: only admins may write to resource_chunks.
 * Returns how many passages were stored.
 */
export async function indexResource(
  supabase: Client,
  resourceId: string,
): Promise<number> {
  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, course_id, file_path, file_name")
    .eq("id", resourceId)
    .single();
  if (error || !resource) throw new Error("File not found for indexing.");

  const { data: blob, error: downloadError } = await supabase.storage
    .from("resources")
    .download(resource.file_path);
  if (downloadError || !blob) {
    throw new Error(`Could not read the file: ${downloadError?.message}`);
  }

  const text = await extractFileText(await blob.arrayBuffer(), resource.file_name);
  const chunks = chunkText(text);

  await supabase.from("resource_chunks").delete().eq("resource_id", resource.id);
  for (let i = 0; i < chunks.length; i += 100) {
    const rows = chunks.slice(i, i + 100).map((content, j) => ({
      resource_id: resource.id,
      course_id: resource.course_id,
      chunk_index: i + j,
      content,
    }));
    const { error: insertError } = await supabase
      .from("resource_chunks")
      .insert(rows);
    if (insertError) throw new Error(`Could not save text: ${insertError.message}`);
  }

  await supabase
    .from("resources")
    .update({ indexed_at: new Date().toISOString() })
    .eq("id", resource.id);
  return chunks.length;
}
