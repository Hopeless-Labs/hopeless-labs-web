import type { Metadata } from "next";

import { type Member, SITE, TEAM } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team",
  description:
    "The people behind Hopeless Labs and the Ruso vulnerability-scanning ecosystem.",
  alternates: { canonical: "/team" },
  openGraph: {
    title: `Team · ${SITE.name}`,
    description: "The people behind Hopeless Labs and Ruso.",
    url: `${SITE.url}/team`,
  },
};

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="font-mono text-sm text-accent">Team</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          The people behind Hopeless Labs
        </h1>
        <p className="mt-4 text-lg text-subtle">
          A community of contributors building Ruso in the open. Want to be on
          this list?{" "}
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:text-accent-strong"
          >
            Start contributing on GitHub
          </a>
          .
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {TEAM.map((member) => (
          <li key={member.name}>
            <MemberCard member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const card = (
    <div className="flex h-full flex-col items-center rounded-xl border border-border p-6 text-center transition-colors hover:border-accent">
      <Avatar member={member} />
      <p className="mt-4 font-semibold">{member.name}</p>
      <p className="mt-1 text-sm text-subtle">{member.role}</p>
    </div>
  );

  if (member.href) {
    return (
      <a
        href={member.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {card}
      </a>
    );
  }
  return card;
}

function Avatar({ member }: { member: Member }) {
  if (member.image) {
    return (
      // Plain <img> keeps the static export dependency-free (no image
      // optimization server). Fixed dimensions avoid layout shift.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.image}
        alt={`${member.name} — ${member.role}`}
        width={96}
        height={96}
        loading="lazy"
        className="h-24 w-24 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-24 items-center justify-center rounded-full bg-muted font-mono text-2xl font-bold text-accent"
    >
      {initials(member.name)}
    </div>
  );
}

// First letters of up to two name parts, e.g. "Ada Lovelace" -> "AL".
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
