import Link from "next/link";

import { NAV, SITE } from "@/lib/site";

// Static server component — no client JS. The mobile menu is a CSS-only
// <details> disclosure so it works in a fully static export without
// shipping any JavaScript.
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight hover:text-accent"
        >
          hopeless
          <span className="text-subtle">/labs</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent">
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.docs}
            className="hover:text-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            href={SITE.github}
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-background hover:bg-accent-strong"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>

        {/* Mobile menu — pure CSS disclosure, no JavaScript */}
        <details className="group relative sm:hidden">
          <summary
            className="flex cursor-pointer list-none items-center rounded-md border border-border p-2 [&::-webkit-details-marker]:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {/* Hamburger; turns into an X when the menu is open */}
              <line x1="4" y1="7" x2="20" y2="7" className="group-open:hidden" />
              <line x1="4" y1="12" x2="20" y2="12" className="group-open:hidden" />
              <line x1="4" y1="17" x2="20" y2="17" className="group-open:hidden" />
              <line x1="6" y1="6" x2="18" y2="18" className="hidden group-open:block" />
              <line x1="18" y1="6" x2="6" y2="18" className="hidden group-open:block" />
            </svg>
          </summary>
          <nav className="absolute right-0 mt-2 flex w-48 flex-col gap-1 rounded-lg border border-border bg-background p-2 text-sm shadow-lg">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 hover:bg-muted hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.docs}
              className="rounded-md px-3 py-2 hover:bg-muted hover:text-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
            <a
              href={SITE.github}
              className="mt-1 rounded-md bg-accent px-3 py-2 text-center font-medium text-background hover:bg-accent-strong"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
