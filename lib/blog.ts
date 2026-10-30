import fs from "node:fs";
import path from "node:path";

import { marked } from "marked";

import { getSupabaseAdmin } from "./supabase";

// Blog content comes from two places:
//   content/blog/*.md  — posts committed with the site (reading filesystem is
//                        safe because everything below runs at build time).
//   public.posts       — posts published from /admin.
// Both are merged here; a database post wins when a slug exists in both.
//
// This only runs during `next build` (static export). If the Supabase env is
// missing the database halves return empty and the Markdown posts still build.

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 200;

// Fallback slug so a build is never empty. `output: "export"` refuses to build a
// route whose generateStaticParams() returns nothing ("missing
// generateStaticParams()"), and that would fail the deploy even though the code
// is fine. See FALLBACK_POST below.
export const FALLBACK_SLUG = "blog-unavailable";

function blogDbEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

function note(message: string): void {
  console.warn(`[blog] ${message}`);
}

export type PostMeta = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date (`YYYY-MM-DD`), used for sorting and `time datetime`. */
  date: string;
  author: string;
  tags: string[];
  readingMinutes: number;
  /** Public URL of the cover image, when the post has one. */
  cover?: string;
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

function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(wordCount(markdown) / WORDS_PER_MINUTE));
}

function toMeta(slug: string, data: Frontmatter, markdown: string): PostMeta {
  return {
    slug,
    title: stringField(data, "title") || slug,
    summary: stringField(data, "summary"),
    date: stringField(data, "date"),
    author: stringField(data, "author") || "Hopeless Labs",
    tags: tagsField(data),
    readingMinutes: readingMinutes(markdown),
  };
}

function toHtml(markdown: string): string {
  // Content is authored by site staff, so the HTML is trusted.
  return marked.parse(markdown, { gfm: true, async: false }) as string;
}

function readPostFile(slug: string): { meta: PostMeta; markdown: string } | null {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, body } = parseFrontmatter(raw);
  if (stringField(data, "draft") === "true") return null;
  return { meta: toMeta(slug, data, body), markdown: body };
}

function filePosts(): PostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPostFile(file.slice(0, -3)))
    .filter((entry): entry is { meta: PostMeta; markdown: string } => entry !== null)
    .map((entry) => entry.meta);
}

function filePost(slug: string): Post | null {
  const entry = readPostFile(slug);
  if (!entry) return null;
  return { ...entry.meta, html: toHtml(entry.markdown) };
}

// ---------------------------------------------------------------------------
// Published posts from Postgres
// ---------------------------------------------------------------------------

type DbPost = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  tags: string[] | null;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string;
};

const DB_COLUMNS = "slug,title,summary,body,author,tags,cover_image,published_at,updated_at";

function dbMeta(row: DbPost): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    date: (row.published_at ?? row.updated_at).slice(0, 10),
    author: row.author,
    tags: row.tags ?? [],
    readingMinutes: readingMinutes(row.body),
    cover: row.cover_image ?? undefined,
  };
}

async function dbPosts(): Promise<DbPost[]> {
  if (!blogDbEnabled()) {
    note("next_public_supabase_url / supabase_secret_key not set — skipping database posts");
    return [];
  }
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("posts")
      .select(DB_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) {
      note(`posts query failed (${error.code ?? "?"}): ${error.message}`);
      return [];
    }
    return (data ?? []) as DbPost[];
  } catch (caught) {
    note(`posts query threw: ${caught instanceof Error ? caught.message : String(caught)}`);
    return [];
  }
}

async function dbPost(slug: string): Promise<DbPost | null> {
  if (!blogDbEnabled()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("posts")
      .select(DB_COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      note(`post "${slug}" query failed (${error.code ?? "?"}): ${error.message}`);
      return null;
    }
    return (data as DbPost | null) ?? null;
  } catch (caught) {
    note(`post "${slug}" query threw: ${caught instanceof Error ? caught.message : String(caught)}`);
    return null;
  }
}

// Shown when there is nothing else to build. It keeps `output: export` happy
// and, more usefully, tells a visitor the site is up but its posts are missing
// instead of 404-ing. Not linked from anywhere.
const FALLBACK_POST: PostMeta = {
  slug: FALLBACK_SLUG,
  title: "Posts are unavailable",
  summary:
    "The blog could not reach its database during the last build, so no posts were published.",
  date: "1970-01-01",
  author: "Hopeless Labs",
  tags: [],
  readingMinutes: 1,
};

const FALLBACK_HTML = `<p>This build had no posts to publish: the blog database was
unreachable or not configured (for example a missing
<code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>SUPABASE_SECRET_KEY</code>
environment variable). Blog posts will reappear after the next successful build.</p>`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function newestFirst(a: PostMeta, b: PostMeta): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title);
}

/** All published posts (database + Markdown files), newest first. */
export async function getAllPosts(): Promise<PostMeta[]> {
  const fromDb = (await dbPosts()).map(dbMeta);
  const taken = new Set(fromDb.map((post) => post.slug));
  const merged = [...fromDb, ...filePosts().filter((post) => !taken.has(post.slug))].sort(
    newestFirst,
  );
  if (merged.length > 0) return merged;
  note("no posts found — emitting a placeholder so the static export can build");
  return [FALLBACK_POST];
}

/** A single published post with its rendered HTML, or null when unknown. */
export async function getPost(slug: string): Promise<Post | null> {
  if (slug === FALLBACK_SLUG) return { ...FALLBACK_POST, html: FALLBACK_HTML };
  const row = await dbPost(slug);
  if (row) return { ...dbMeta(row), html: toHtml(row.body) };
  return filePost(slug);
}

export { formatDate } from "./format";
