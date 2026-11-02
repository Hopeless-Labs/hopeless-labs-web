"use client";

import { useCallback } from "react";

// The only interactive client component on the public site: a two-state theme
// switch. It flips `theme-light` / `theme-dark` on <html> and remembers the
// choice in localStorage. The sun/moon glyph swap is pure CSS (see
// globals.css) so the button renders identically on the server and client and
// never flashes the wrong icon during hydration.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const currentlyDark =
      root.classList.contains("theme-dark") ||
      (!root.classList.contains("theme-light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = currentlyDark ? "light" : "dark";
    root.classList.toggle("theme-dark", next === "dark");
    root.classList.toggle("theme-light", next === "light");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* Storage blocked (private mode) — the theme still flips for this page. */
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle dark / light theme"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-subtle transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {/* Sun — visible in dark mode (click to go light) */}
      <svg
        className="theme-icon-sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Moon — visible in light mode (click to go dark) */}
      <svg
        className="theme-icon-moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
