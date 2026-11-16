/** The message an action redirected back with, if any. */
export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="my-4 rounded border border-margin bg-sheet p-3 text-sm"
    >
      {message}
    </p>
  );
}

export function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
