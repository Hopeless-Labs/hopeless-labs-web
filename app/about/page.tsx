import type { Metadata } from "next";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hopeless Labs is an open community building security tooling — starting with the Ruso vulnerability-scanning ecosystem.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About · ${SITE.name}`,
    description:
      "An open community building security tooling, starting with Ruso.",
    url: `${SITE.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <p className="font-mono text-sm text-accent">About</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        We make security checks worth sharing.
      </h1>

      <div className="mt-8 flex flex-col gap-6 text-lg leading-relaxed text-subtle">
        <p>
          <strong className="text-foreground">{SITE.name}</strong> is an open
          community of people building tooling for security work. Our first
          project is <strong className="text-foreground">Ruso</strong>: a way to
          describe a vulnerability check as a small, readable script and run it
          anywhere.
        </p>
        <p>
          Most scanners hide their logic behind plugins and config. Ruso takes
          the opposite stance — a check is plain text you can read, review, and
          version like any other code. When the logic is legible, it&apos;s
          easier to trust, easier to fix, and easier to share.
        </p>
        <p>
          That sharing is the point. A check someone writes once should become
          tooling everyone can install. The Ruso registry exists to turn
          one-off research into a growing, community-owned library of scans —
          built in the open, by whoever shows up.
        </p>
      </div>

      <h2 className="mt-14 text-xl font-semibold">What we value</h2>
      <dl className="mt-6 flex flex-col gap-5">
        <Value
          term="Legibility over magic"
          desc="If you can't read what a tool does, you can't trust it. Everything we ship is meant to be read."
        />
        <Value
          term="Small, composable pieces"
          desc="A language, a runtime, a CLI, a registry — each does one job and fits the others."
        />
        <Value
          term="Open by default"
          desc="The ecosystem is open source and the registry is public. Research compounds when it's shared."
        />
      </dl>

      <section className="mt-14 rounded-xl border border-border p-8">
        <h2 className="text-xl font-semibold">Join the community</h2>
        <p className="mt-2 text-subtle">
          The work happens in the open on GitHub — issues, discussions, and pull
          requests are all welcome. Everyone&apos;s invited to contribute.
        </p>
        <a
          href={SITE.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
        >
          Hopeless Labs on GitHub
        </a>
      </section>
    </div>
  );
}

function Value({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <dt className="font-semibold text-foreground">{term}</dt>
      <dd className="mt-1 text-subtle">{desc}</dd>
    </div>
  );
}
