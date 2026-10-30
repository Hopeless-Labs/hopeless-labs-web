import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

// Required for `output: export` — emit this route as a static file.
export const dynamic = "force-static";

// Generated to `out/sitemap.xml` at build time (static export). Blog posts are
// appended from the content directory so publishing one updates the sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ["", "/products", "/blog", "/team", "/about"];
  const pages: MetadataRoute.Sitemap = routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const posts: MetadataRoute.Sitemap = (await getAllPosts()).map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
