// One-off importer: content/blog/*.md  →  public.posts
//   npm run db:import
//
// Reads the Markdown posts that used to ship with the repo and upserts them as
// published rows, so they can be edited from /admin. Idempotent: a slug that
// already exists is updated, not duplicated. Uses the secret key (bypasses RLS)
// because the import must run without a signed-in user.

import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const dir = path.join(process.cwd(), "content", "blog");

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

function unquote(value) {
  return value.replace(/^["']|["']$/g, "").trim();
}

// Mirrors lib/blog.ts: only the `key: value` and `key: [a, b]` forms are used.
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    if (!key) continue;
    data[key] =
      value.startsWith("[") && value.endsWith("]")
        ? value
            .slice(1, -1)
            .split(",")
            .map(unquote)
            .filter(Boolean)
        : unquote(value);
  }
  return { data, body: raw.slice(match[0].length) };
}

function toRow(slug, markdown) {
  const { data, body } = parseFrontmatter(markdown);
  const date = typeof data.date === "string" && data.date ? data.date : null;
  return {
    slug,
    title: (typeof data.title === "string" && data.title) || slug,
    summary: typeof data.summary === "string" ? data.summary : "",
    body,
    author: (typeof data.author === "string" && data.author) || "Hopeless Labs",
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.draft === "true" ? "draft" : "published",
    published_at: date ? `${date}T00:00:00.000Z` : null,
  };
}

async function upsert(row) {
  const response = await fetch(`${url}/rest/v1/posts?on_conflict=slug`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${row.slug}: HTTP ${response.status} ${JSON.stringify(payload)}`);
  return payload?.[0];
}

// The Markdown directory is gone after the first import — that is the expected
// steady state, not a failure.
if (!fs.existsSync(dir)) {
  console.log(`nothing to import (no ${path.relative(process.cwd(), dir)} directory)`);
  process.exit(0);
}

const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
if (files.length === 0) {
  console.log("nothing to import");
  process.exit(0);
}

let imported = 0;
for (const file of files) {
  const slug = file.slice(0, -3);
  const row = toRow(slug, fs.readFileSync(path.join(dir, file), "utf8"));
  const saved = await upsert(row);
  console.log(
    `ok    ${row.slug.padEnd(38)} ${row.status.padEnd(9)} ` +
      `${(row.published_at ?? "no date").slice(0, 10)}  id=${saved?.id ?? "?"}`,
  );
  imported += 1;
}

const list = await fetch(`${url}/rest/v1/posts?select=slug,status&order=slug`, { headers });
const rows = await list.json();
console.log(`\nimported ${imported}; posts in database: ${rows.length}`);
for (const row of rows) console.log(`  ${row.status.padEnd(9)} ${row.slug}`);
