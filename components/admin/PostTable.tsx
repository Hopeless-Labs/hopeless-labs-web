"use client";

import Link from "next/link";

import type { Database } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

export type Post = Database["public"]["Tables"]["posts"]["Row"];

type Props = {
  posts: Post[];
  loading: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
};

export function PostTable({ posts, loading, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="mt-8 flex flex-col gap-3" aria-busy="true" aria-label="Loading posts">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-16 animate-pulse rounded-xl border border-border bg-muted/60" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-mono text-sm text-subtle">No posts yet</p>
        <p className="mt-2 text-sm text-subtle">
          Drafts stay hidden from the site until you publish them.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-slim mt-8 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <caption className="sr-only">Blog posts, most recently updated first</caption>
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th scope="col" className="label px-4 py-3 font-normal">
              Title
            </th>
            <th scope="col" className="label px-4 py-3 font-normal">
              Status
            </th>
            <th scope="col" className="label px-4 py-3 font-normal">
              Date
            </th>
            <th scope="col" className="label px-4 py-3 text-right font-normal">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
            >
              <td className="px-4 py-3 align-middle">
                <span className="font-medium">{post.title}</span>
                <span className="mt-0.5 block truncate font-mono text-xs text-subtle">
                  /blog/{post.slug}
                </span>
              </td>
              <td className="px-4 py-3 align-middle">
                <StatusChip status={post.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-middle text-subtle">
                {formatDate((post.published_at ?? post.updated_at).slice(0, 10))}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                {post.status === "published" && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="btn btn-link mr-4 text-accent"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Link>
                )}
                <button type="button" onClick={() => onEdit(post)} className="btn btn-link mr-4">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  className="btn btn-link hover:!text-accent-strong"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`chip ${
        published ? "border-accent/50 text-accent" : "border-border text-subtle"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${published ? "bg-accent" : "bg-subtle"}`}
      />
      {status}
    </span>
  );
}
