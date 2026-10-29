import fs from "node:fs";
import path from "node:path";

import { marked } from "marked";

// Blog content lives as Markdown files under `content/blog`. Everything here
// runs at build time only (Server Components / static export), so reading the
// filesystem is safe and the deployed site stays fully static.

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 200;

export type PostMeta = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date (`YYYY-MM-DD`), used for sorting and `time datetime`. */
  date: string;
  author: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & { html: string };

type Frontmatter = Record<string, string | string[]>;

function unquote(value: string): string {
  return value.replace(/^["']|["']$/g, "").trim();
}

// Tiny frontmatter reader for the `key: value` and `key: [a, b]` forms used by
// our posts. Deliberately not a YAML parser — no dependency, no surprises.
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const rawValue = line.slice(sep + 1).trim();
    if (!key) continue;
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((item) => unquote(item))
        .filter(Boolean);
    } else {
      data[key] = unquote(rawValue);
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

function stringField(data: Frontmatter, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function tagsField(data: Frontmatter): string[] {
  const value = data["tags"];
  return Array.isArray(value) ? value : [];
}

function wordCount(markdown: string): number {
  // Strip fenced code blocks, inline code, and markdown punctuation before
  // counting so a code-heavy post does not claim an absurd reading time.
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

function toMeta(slug: string, data: Frontmatter, markdown: string): PostMeta {
  return {
    slug,
    title: stringField(data, "title") || slug,
    summary: stringField(data, "summary"),
    date: stringField(data, "date"),
    author: stringField(data, "author") || "Hopeless Labs",
    tags: tagsField(data),
    readingMinutes: Math.max(1, Math.round(wordCount(markdown) / WORDS_PER_MINUTE)),
  };
}

function readPostFile(slug: string): { meta: PostMeta; markdown: string } | null {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, body } = parseFrontmatter(raw);
  if (stringField(data, "draft") === "true") return null;
  return { meta: toMeta(slug, data, body), markdown: body };
}

/** All published posts, newest first. */
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPostFile(file.slice(0, -3)))
    .filter((entry): entry is { meta: PostMeta; markdown: string } => entry !== null)
    .map((entry) => entry.meta)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}

/** A single post with its rendered HTML, or null when the slug is unknown. */
export function getPost(slug: string): Post | null {
  const entry = readPostFile(slug);
  if (!entry) return null;
  // Content is authored in this repository, so the HTML is trusted.
  const html = marked.parse(entry.markdown, { gfm: true, async: false }) as string;
  return { ...entry.meta, html };
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
