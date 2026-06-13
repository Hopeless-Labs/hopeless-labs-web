import Link from "next/link";

import { NAV, SITE } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-mono text-sm font-bold">
            hopeless<span className="text-subtle">/labs</span>
          </p>
          <p className="mt-2 text-sm text-subtle">{SITE.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-subtle">Site</span>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-accent">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-subtle">Ruso</span>
            <a href={SITE.docs} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <a href={SITE.registry} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
              Registry
            </a>
            <a href={SITE.github} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </nav>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-subtle">
        © {year} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
