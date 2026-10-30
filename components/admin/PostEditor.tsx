"use client";

import { useEffect, useMemo, useState } from "react";

import { marked } from "marked";

import { getSupabase } from "@/lib/supabase";

import type { Post } from "./PostTable";

type Status = "draft" | "published";

type Form = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  author: string;
  tags: string;
  status: Status;
  cover_image: string | null;
};

type Props = {
  post: Post | null;
  onCancel: () => void;
  onSaved: () => void;
};

const WORDS_PER_MINUTE = 200;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

function initialForm(post: Post | null): Form {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    summary: post?.summary ?? "",
    body: post?.body ?? "",
    author: post?.author ?? "Hopeless Labs",
    tags: (post?.tags ?? []).join(", "),
    status: (post?.status === "published" ? "published" : "draft") as Status,
    cover_image: post?.cover_image ?? null,
  };
}

export function PostEditor({ post, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<Form>(() => initialForm(post));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => initialForm(post), [post]);
  const dirty = useMemo(
    () => coverFile !== null || JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial, coverFile],
  );

  const words = countWords(form.body);
  const previewHtml = useMemo(
    () => marked.parse(form.body || "", { gfm: true, async: false }) as string,
    [form.body],
  );

  // Revoke the object URL when the picker changes or unmounts, otherwise every
  // selected file leaks a blob for the life of the page.
  useEffect(() => {
    return () => {
      if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
    };
  }, [coverObjectUrl]);

  // A browser reload or tab close with unsaved edits should ask first.
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function pickCover(file: File | null) {
    if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
    setCoverFile(file);
    setCoverObjectUrl(file ? URL.createObjectURL(file) : null);
  }

  async function uploadCover(slug: string): Promise<string | null> {
    if (!coverFile) return form.cover_image;
    const supabase = getSupabase();
    const extension = (coverFile.name.split(".").pop() ?? "png").toLowerCase();
    const path = `${slug}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("blog-covers")
      .upload(path, coverFile, { cacheControl: "3600", contentType: coverFile.type });
    if (uploadError) throw new Error(uploadError.message);
    return supabase.storage.from("blog-covers").getPublicUrl(path).data.publicUrl;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const title = form.title.trim();
      const slug = slugify(form.slug || title);
      if (!title) throw new Error("Title is required.");
      if (!slug) throw new Error("Slug is required.");

      const coverImage = await uploadCover(slug);
      const supabase = getSupabase();
      const payload = {
        slug,
        title,
        summary: form.summary.trim(),
        body: form.body,
        author: form.author.trim() || "Hopeless Labs",
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: form.status,
        cover_image: coverImage,
      };

      if (post) {
        const { error: updateError } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", post.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error: insertError } = await supabase
          .from("posts")
          .insert({ ...payload, created_by: user?.id ?? null });
        if (insertError) throw new Error(insertError.message);
      }

      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 pb-4">
      {/* Action bar stays reachable while the (long) body is being edited. */}
      <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-base font-semibold">
            {post ? "Edit post" : "New post"}
          </h2>
          {dirty && (
            <span className="chip border-accent/50 text-accent" title="There are unsaved changes">
              unsaved
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="hidden font-mono text-xs text-subtle sm:inline">
            {words} words · ~{Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min
          </span>
          <button
            type="button"
            onClick={() => setSplit((value) => !value)}
            className="btn btn-link hidden font-mono text-xs lg:inline-flex"
            aria-pressed={split}
          >
            {split ? "single pane" : "split view"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-quiet">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !dirty}
            className="btn btn-primary"
            title={dirty ? "Save changes" : "No changes to save"}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="animate-fade-up mt-4 rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent"
        >
          {error}
        </p>
      )}

      <div className={`mt-6 grid gap-5 ${split ? "lg:grid-cols-2" : ""}`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Title</span>
            <input
              required
              autoFocus={!post}
              placeholder="How we scan for exposed Redis"
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                set("title", title);
                if (!slugTouched) set("slug", slugify(title));
              }}
              className="field mt-1.5 text-base"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="label">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
              onBlur={() => set("slug", slugify(form.slug))}
              className="field field-mono mt-1.5"
            />
            <span className="mt-1 block truncate font-mono text-xs text-subtle">
              /blog/{form.slug || "your-slug"}
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="label">Summary</span>
            <textarea
              rows={2}
              placeholder="One or two sentences for the index page and social cards."
              value={form.summary}
              onChange={(event) => set("summary", event.target.value)}
              className="field mt-1.5 resize-y"
            />
          </label>

          <label className="block">
            <span className="label">Author</span>
            <input
              value={form.author}
              onChange={(event) => set("author", event.target.value)}
              className="field mt-1.5"
            />
          </label>

          <label className="block">
            <span className="label">Status</span>
            <select
              value={form.status}
              onChange={(event) => set("status", event.target.value as Status)}
              className="field mt-1.5"
            >
              <option value="draft">draft — hidden from the site</option>
              <option value="published">published — live on next build</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="label">Tags</span>
            <input
              placeholder="rsl, tutorial"
              value={form.tags}
              onChange={(event) => set("tags", event.target.value)}
              className="field field-mono mt-1.5"
            />
            <span className="mt-1 block text-xs text-subtle">Comma separated.</span>
          </label>

          <div className="sm:col-span-2">
            <span className="label">Cover image</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-4">
              <label className="flex h-20 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border text-center text-xs text-subtle transition-colors hover:border-accent hover:text-accent">
                {(coverObjectUrl ?? form.cover_image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(coverObjectUrl ?? form.cover_image) as string}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-2">Choose file</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => pickCover(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="text-xs text-subtle">
                <p>PNG, JPEG, or WebP. Stored in the public blog-covers bucket.</p>
                {(coverFile || form.cover_image) && (
                  <button
                    type="button"
                    onClick={() => {
                      pickCover(null);
                      set("cover_image", null);
                    }}
                    className="btn btn-link mt-1 text-xs"
                  >
                    Remove cover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={split ? "grid gap-5" : "grid gap-5 sm:grid-cols-2"}>
          <label className="block">
            <span className="label">Body (Markdown)</span>
            <textarea
              rows={split ? 24 : 16}
              placeholder={"## Heading\n\nWrite the post…"}
              value={form.body}
              onChange={(event) => set("body", event.target.value)}
              spellCheck={false}
              className="field field-mono scroll-slim mt-1.5 resize-y leading-relaxed"
            />
          </label>

          <section className="min-w-0">
            <span className="label">Preview</span>
            <div className="scroll-slim mt-1.5 max-h-[38rem] overflow-y-auto rounded-lg border border-border p-5">
              {form.body.trim() ? (
                <div className="prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-sm text-subtle">Nothing to preview yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
