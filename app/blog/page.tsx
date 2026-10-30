import type { Metadata } from "next";
import Link from "next/link";

import { formatDate, getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from the Hopeless Labs team on scripting, scanning, and the Ruso ecosystem.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog · ${SITE.name}`,
    description: "Notes on scripting, scanning, and the Ruso ecosystem.",
    url: `${SITE.url}/blog`,
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="font-mono text-sm text-accent">Blog</p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Notes from the lab
        </h1>
        <p className="mt-4 text-lg text-subtle">
          Design decisions, walkthroughs, and the occasional look inside the
          runtime. Written by the people who build Ruso.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 text-subtle">No posts yet.</p>
      ) : (
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border transition-colors hover:border-accent">
                {post.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover}
                    alt=""
                    loading="lazy"
                    className="h-40 w-full border-b border-border object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-subtle">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{post.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">
                    <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                      {post.title}
                    </Link>
                  </h2>
                  {post.summary && <p className="mt-2 text-subtle">{post.summary}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-2 pt-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="ml-auto text-sm font-medium text-accent hover:text-accent-strong"
                    >
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
