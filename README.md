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

- `app/` — routes (`/`, `/products`, `/blog`, `/team`, `/about`), root layout +
  global SEO, `sitemap.ts`, `robots.ts`, `manifest.ts`, `icon.svg`, `rss.xml`.
- `components/` — `Header`, `Footer`.
- `content/blog/` — one Markdown file per post. The filename is the slug.
- `lib/site.ts` — single source of truth for site constants, nav, and the
  product catalogue.
- `lib/blog.ts` — reads `content/blog`, parses frontmatter, renders Markdown.

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

## SEO

Per-page metadata via the Next Metadata API (title templates, OpenGraph,
Twitter cards, canonicals), an `Organization` JSON-LD block in the root layout,
plus generated `sitemap.xml` and `robots.txt`. Update `SITE.url` in
`lib/site.ts` if the canonical domain changes.
