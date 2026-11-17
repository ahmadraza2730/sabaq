/** Shown instantly while a page loads, so navigation never feels stuck. */
export default function Loading() {
  return (
    <div className="pt-10" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-2/3 max-w-lg rounded bg-rule/70 motion-safe:animate-pulse" />
      <div className="mt-4 h-4 w-1/2 max-w-md rounded bg-rule/60 motion-safe:animate-pulse" />
      <div className="sheet mt-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="line">
            <span className="in-margin" />
            <span className="h-4 w-3/4 rounded bg-rule/50 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
