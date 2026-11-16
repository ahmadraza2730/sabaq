export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until the two Supabase env vars are set; the site then runs on sample data. */
export const isConfigured = Boolean(supabaseUrl && supabaseKey);

/** Stage 1 launches with one university. Later stages read this from the URL. */
export const DEFAULT_UNIVERSITY = "fast-nuces";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "zip",
];
