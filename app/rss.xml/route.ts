import { FALLBACK_SLUG, getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

// Static export: emit /rss.xml at build time from the same posts the pages use.
export const dynamic = "force-static";

// Kept in one place so the sitemap and the feed agree with lib/blog.ts about
// which slug is the placeholder, never a real post.
function publishedPosts<T extends { slug: string }>(posts: T[]): T[] {
  return posts.filter((post) => post.slug !== FALLBACK_SLUG);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Same reason as the sitemap: skip the placeholder post when the build had no data.
  const posts = publishedPosts(await getAllPosts());
  const items = posts
    .map((post) => {
      const url = `${SITE.url}/blog/${post.slug}/`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <author>noreply@hopeless-labs.com (${escapeXml(post.author)})</author>
      <description>${escapeXml(post.summary)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${SITE.name} — Blog`)}</title>
    <link>${SITE.url}/blog/</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
