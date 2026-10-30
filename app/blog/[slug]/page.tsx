import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate, getAllPosts, getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

// Static export needs every post known at build time. A slug that is not in
// this list renders the 404 page.
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} · ${SITE.name}`,
      description: post.summary,
      url: `${SITE.url}/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const posts = await getAllPosts();
  const index = posts.findIndex((entry) => entry.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : undefined;
  const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined;

  return (
    <article className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <header>
        <p className="font-mono text-sm text-accent">
          <Link href="/blog" className="hover:text-accent-strong">
            Blog
          </Link>
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-subtle">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.author}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover}
          alt=""
          className="mt-10 w-full rounded-xl border border-border object-cover"
        />
      )}

      {/* Markdown is authored by site staff, so the HTML is trusted. */}
      <div
        className="prose mt-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <nav className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-sm sm:flex-row sm:items-start sm:justify-between">
        <Link href="/blog" className="font-medium text-accent hover:text-accent-strong">
          ← All posts
        </Link>
        <div className="flex flex-col gap-1 sm:items-end">
          {newer && (
            <Link href={`/blog/${newer.slug}`} className="hover:text-accent">
              Newer: {newer.title}
            </Link>
          )}
          {older && (
            <Link href={`/blog/${older.slug}`} className="hover:text-accent">
              Older: {older.title}
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
