import type { MetadataRoute } from "next";

import { FALLBACK_SLUG, getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

// Required for `output: export` — emit this route as a static file.
export const dynamic = "force-static";

// Generated to `out/sitemap.xml` at build time (static export). Blog posts come
// from the database (see lib/blog.ts), so publishing one updates the sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ["", "/products", "/blog", "/team", "/about"];
  const pages: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  // A placeholder build (no database reachable) must not advertise a junk URL.
  const posts: MetadataRoute.Sitemap = (await getAllPosts())
    .filter((post) => post.slug !== FALLBACK_SLUG)
    .map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
