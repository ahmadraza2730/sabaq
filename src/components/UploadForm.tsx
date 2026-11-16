"use client";

import Link from "next/link";
import { useState } from "react";
import { createResource } from "@/app/actions";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "error"; message: string }
  | { kind: "done" };

export function UploadForm({
  userId,
  courses,
  preselected,
}: {
  userId: string;
  courses: { id: string; label: string }[];
  preselected: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus({ kind: "error", message: "Choose a file to upload." });
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setStatus({
        kind: "error",
        message: `That file type is not accepted. Use ${ALLOWED_EXTENSIONS.join(", ")}.`,
      });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus({
        kind: "error",
        message: "That file is larger than 20 MB. Compress it or split it.",
      });
      return;
    }

    // Step 1: the browser sends the file straight to storage, into this
    // student's own folder. Storage rules reject any other folder.
    setStatus({ kind: "working", step: "Uploading the file" });
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const upload = await supabase.storage
      .from("resources")
      .upload(filePath, file, { contentType: file.type || undefined });
    if (upload.error) {
      setStatus({ kind: "error", message: upload.error.message });
      return;
    }

    // Step 2: the server records the file as pending review.
    setStatus({ kind: "working", step: "Saving the details" });
    const yearValue = String(data.get("year") ?? "");
    const result = await createResource({
      courseId: String(data.get("course")),
      title: String(data.get("title") ?? ""),
      type: String(data.get("type")),
      year: yearValue ? Number(yearValue) : null,
      filePath,
      fileName: file.name,
    });
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }

    form.reset();
    setStatus({ kind: "done" });
  }

  const working = status.kind === "working";
  const thisYear = new Date().getFullYear();

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Course
        <select
          name="course"
          required
          defaultValue={preselected}
          className="field"
        >
          <option value="" disabled>
            Choose a course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Title
        <input
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder="Such as Midterm 1 with solutions"
          className="field"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Kind
          <select name="type" required defaultValue="notes" className="field">
            <option value="notes">Notes</option>
            <option value="past_paper">Past paper</option>
            <option value="assignment">Assignment</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Year (optional)
          <input
            name="year"
            type="number"
            min={2000}
            max={thisYear}
            placeholder={String(thisYear)}
            className="field"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        File
        <input
          name="file"
          type="file"
          required
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          className="field"
        />
        <span className="font-normal text-ink-soft">
          PDF, Word, PowerPoint, image or zip, up to 20 MB.
        </span>
      </label>

      <button className="btn" disabled={working}>
        {working ? `${status.step}…` : "Upload file"}
      </button>

      {status.kind === "error" && (
        <p role="alert" className="rounded border border-margin bg-sheet p-3 text-sm">
          {status.message}
        </p>
      )}
      {status.kind === "done" && (
        <p role="status" className="rounded bg-hi p-3 text-sm font-medium">
          Uploaded. It appears on the course page once a reviewer approves it.
          Track it on{" "}
          <Link href="/profile" className="underline">
            your profile
          </Link>
          .
        </p>
      )}
    </form>
  );
}
