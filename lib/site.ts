// Single source of truth for site-wide constants: canonical URL, nav,
// external links, and the product catalogue rendered across pages.

export const SITE = {
  name: "Hopeless Labs",
  shortName: "Hopeless Labs",
  // Canonical origin — drives metadataBase, sitemap, robots, and JSON-LD.
  url: "https://hopeless-labs.com",
  tagline: "Security tooling for people who read the source.",
  description:
    "Hopeless Labs builds Ruso — an open vulnerability-scanning ecosystem: a purpose-built scripting language, a fast runtime and CLI, and a public script registry.",
  github: "https://github.com/Hopeless-Labs",
  docs: "https://docs.ruso.hopeless-labs.com",
  registry: "https://ruso.hopeless-labs.com",
} as const;

export const NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/team", label: "Team" },
  { href: "/about", label: "About" },
];

export type Member = {
  name: string;
  role: string;
  // Avatar source. Leave empty to render a generated initials avatar.
  // For GitHub users, `https://github.com/<username>.png` works with no
  // local asset to manage.
  image?: string;
  // Optional profile link (rendered as a link on the card).
  href?: string;
};

// Team roster — edit this list to add or update members. Each card shows
// the profile picture (or initials fallback), name, and role.
export const TEAM: ReadonlyArray<Member> = [
  {
    name: "jeagercoder",
    role: "Founder & Maintainer",
    image: "https://github.com/jeagercoder.png",
    href: "https://github.com/jeagercoder",
  },
  {
    name: "Kenji Subagja",
    role: "Security Researcher",
    image: "https://github.com/kenjisubagja.png",
    href: "https://github.com/kenjisubagja",
  },
  {
    name: "Choirul Huda",
    role: "Security Researcher & Project Manager",
    image: "https://github.com/cehuda1.png",
    href: "https://github.com/cehuda1",
  },
];

export type Product = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

export const PRODUCTS: ReadonlyArray<Product> = [
  {
    slug: "rsl",
    name: "Ruso Scripting Language",
    summary: "A tiny DSL for describing a single security question.",
    description:
      "Declare probes, send them, and decide what a finding looks like. Scripts are small, readable, and version-controlled — no boilerplate, no framework to learn.",
    href: "https://docs.ruso.hopeless-labs.com/rsl/reference.html",
    hrefLabel: "Language reference",
  },
  {
    slug: "cli",
    name: "Ruso CLI",
    summary: "Compile, scan, and report from your terminal or CI.",
    description:
      "Point it at a target, run a script, get a structured report. Group findings by target, export results, and wire scans straight into your pipeline.",
    href: "https://docs.ruso.hopeless-labs.com/cli/reference.html",
    hrefLabel: "CLI reference",
  },
  {
    slug: "runtime",
    name: "Ruso Runtime",
    summary: "A compact bytecode VM that executes scans fast.",
    description:
      "Scripts compile to a validated bytecode format that the runtime executes directly — the same artifact the registry ships and the CLI runs.",
    href: "https://docs.ruso.hopeless-labs.com/internals/bytecode.html",
    hrefLabel: "Bytecode format",
  },
  {
    slug: "registry",
    name: "Ruso Registry",
    summary: "Browse, publish, and install community scan scripts.",
    description:
      "A public registry for sharing Ruso scripts. Find a check someone already wrote, or publish your own and install it with one command.",
    href: "https://ruso.hopeless-labs.com",
    hrefLabel: "Open the registry",
  },
];
