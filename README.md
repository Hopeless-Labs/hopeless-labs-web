# hopeless-labs-web

Official website for **Hopeless Labs** — the shop behind the
[Ruso](https://github.com/Hopeless-Labs) vulnerability-scanning ecosystem.

A fully static, server-rendered [Next.js](https://nextjs.org) site (App
Router). No client-side JavaScript beyond Next's runtime, styled with
[Tailwind CSS v4](https://tailwindcss.com) at build time. Runtime dependencies
are just `next`, `react`, and `react-dom`.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # writes the static site to ./out
```

`next.config.ts` sets `output: "export"`, so `out/` is a self-contained bundle
of HTML/CSS/JS that any static host or CDN can serve.

## Structure

- `app/` — routes (`/`, `/products`, `/blog`, `/team`, `/about`, `/admin`), root
  layout + global SEO, `sitemap.ts`, `robots.ts`, `manifest.ts`, `icon.svg`,
  `rss.xml`.
- `components/` — `Header`, `Footer`; `components/admin/` — login form, post
  table, post editor.
- `content/blog/` — one Markdown file per post. The filename is the slug.
- `lib/site.ts` — single source of truth for site constants, nav, and the
  product catalogue.
- `lib/blog.ts` — reads `content/blog`, parses frontmatter, renders Markdown.
- `lib/supabase.ts` — Supabase clients (publishable + secret key).
- `scripts/db-check.mjs` — connectivity smoke test (`npm run db:check`).
- `supabase/` — CLI config and SQL migrations.

## Blog

Add a file to `content/blog/<slug>.md` with this frontmatter:

```markdown
---
title: "Post title"
summary: "One or two sentences for the index page and social cards."
date: 2026-10-27
author: jeagercoder
tags: [rsl, tutorial]
draft: false
---
```

`title`, `summary`, `date`, and `author` are used by the page and by
`/rss.xml`; `tags` render as chips; `draft: true` hides the post from the site
and the sitemap. Posts are sorted by `date`, newest first, and the index,
sitemap, and feed update on the next build.

The Markdown posts that used to ship in this directory have moved into
`public.posts` and are edited from `/admin`; the directory is no longer read at
build time. To pull a file back in (or seed a fresh project):

```bash
npm run db:import   # content/blog/*.md → posts, upserted by slug
```

## Database (Supabase)

Hosted Postgres on Supabase — project `pzyurpyqlsguvtexvpce`
(`https://pzyurpyqlsguvtexvpce.supabase.co`). Credentials live in `.env.local`
(gitignored); `.env.example` lists what is needed.

| Variable | Exposure | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | both clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | `getSupabase()` — browser |
| `SUPABASE_SECRET_KEY` | **secret** | `getSupabaseAdmin()` — build/Node only |

```ts
import { getSupabaseAdmin } from "@/lib/supabase";

const { data } = await getSupabaseAdmin().from("posts").select("*");
```

Because the site is a static export there is no server at runtime, so:

- Anything the browser reads must be allowed by a Row Level Security policy.
  A table with RLS on and no policies returns zero rows — that is the default,
  and the publishable key cannot bypass it.
- `getSupabaseAdmin()` skips RLS. Keep it out of Client Components; it belongs
  in build-time code (Server Components, `next build`) or in scripts.
- To read data on every page load without a rebuild, fetch it client-side with
  `getSupabase()` in a `"use client"` component — otherwise the content is
  baked in at build time.

Check connectivity at any time:

```bash
npm run db:check
```

Talk to Postgres directly (psql uses `SUPABASE_DB_URL`, session pooler):

```bash
npm run db:psql                 # interactive session
npm run db:psql -- -c '\dt'     # one-off command
```

The direct host `db.<ref>.supabase.co` is IPv6-only; on networks without IPv6
use the session pooler string (`aws-1-eu-west-3.pooler.supabase.com`).

### Schema

Two tables, both protected by RLS (`supabase/migrations/`):

- `profiles` — one row per auth user, created automatically on signup by the
  `on_auth_user_created` trigger. `role` is `admin` or `editor`; only `admin`
  may write posts.
- `posts` — `slug`, `title`, `summary`, `body` (Markdown), `author`, `tags[]`,
  `cover_image`, `status` (`draft` / `published`), `published_at`, plus
  `created_by` / timestamps. Anon may read published rows only.

### Migrations

Schema changes are versioned as SQL files in `supabase/migrations/`. Set
`SUPABASE_DB_URL` in `.env.local` (dashboard → Settings → Database →
Connection string → URI) — that is the only credential `db:push` needs.

```bash
npm run db:new add_post_views   # writes supabase/migrations/<ts>_add_post_views.sql
npm run db:push                 # apply pending migrations to the hosted project
npm run db:types                # regenerate lib/database.types.ts from the live schema
```

Never edit an applied migration: add a new one. `db:types` requires
`lib/database.types.ts` to be committed whenever the schema changes.

### First admin

`auth.users` rows created in the dashboard (or via signup) get a `profiles` row
with `role = 'editor'`. Promote the first admin once, from the dashboard's SQL
editor — it runs as `postgres`, which bypasses RLS:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

After that the admin panel signs in as that user with
`getSupabase().auth.signInWithPassword(...)`; writes go through the publishable
key and are allowed by the `posts: admins *` policies. The secret key is never
needed in the browser.

## Admin panel

`/admin` — sign in, list posts, create/edit/delete, Markdown editor with live
preview, cover upload, draft/publish. It is a client-only screen (the site is a
static export, so no server guard): authorisation is enforced by RLS, and the
component only decides what to render. Metadata sets `robots: noindex`.

Cover images go to the public `blog-covers` bucket and are uploaded as the
signed-in admin, so the same policy that guards posts guards the bucket.

Publishing is build-time: a post goes live on `/blog`, the sitemap, and the RSS
feed on the next `npm run build`. `prebuild` wipes `.next` first — without that,
Next reuses the previous static render and a freshly published post silently
misses the index (the file-based posts never changed, so Next sees no reason to
re-render).

### Styling

`app/globals.css` defines the palette as CSS variables per color scheme, plus a
small set of component classes used by the admin screens: `field`, `btn` with
`btn-primary`/`btn-quiet`/`btn-link`, `card`, `chip`, `label`, and `scroll-slim`
for dense scroll areas. A global `:focus-visible` ring keeps keyboard focus
visible on the utility-styled public pages too. Prefer these over new one-off
utility chains when adding admin UI.

## SEO

Per-page metadata via the Next Metadata API (title templates, OpenGraph,
Twitter cards, canonicals), an `Organization` JSON-LD block in the root layout,
plus generated `sitemap.xml` and `robots.txt`. Update `SITE.url` in
`lib/site.ts` if the canonical domain changes.
