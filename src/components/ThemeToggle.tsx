"use client";

/**
 * Switches between light and dark. The icon is picked by CSS from the
 * class already on <html>, so it never flickers on load.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode); the switch still works.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-9 cursor-pointer place-items-center rounded border border-rule bg-sheet text-ink hover:border-ink"
      aria-label="Switch between light and dark"
      title="Switch between light and dark"
    >
      {/* Moon in light mode */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="dark:hidden">
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {/* Sun in dark mode */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="hidden dark:block">
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
