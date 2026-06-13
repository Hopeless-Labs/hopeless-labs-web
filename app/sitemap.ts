import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

// Required for `output: export` — emit this route as a static file.
export const dynamic = "force-static";

// Generated to `out/sitemap.xml` at build time (static export).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/products", "/team", "/about"];
  return routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
