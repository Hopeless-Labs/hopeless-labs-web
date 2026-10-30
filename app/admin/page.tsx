"use client";

import { useCallback, useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { LoginForm } from "@/components/admin/LoginForm";
import { PostEditor } from "@/components/admin/PostEditor";
import { PostTable, type Post } from "@/components/admin/PostTable";
import { formatDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

// Client-only screen: the site is a static export, so there is no server to
// guard the route. Authorisation is enforced by Postgres RLS — this component
// just decides what to render. Signing in as a non-admin shows the denied
// state, and even a forged UI cannot write because the policies re-check
// profiles.role on every statement.

type Phase = "loading" | "signed-out" | "denied" | "ready";
type View = { kind: "list" } | { kind: "new" } | { kind: "edit"; post: Post };

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [view, setView] = useState<View>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setListLoading(true);
    const { data, error: loadError } = await getSupabase()
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setPosts(data ?? []);
    setListLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!session) {
      setPhase("signed-out");
      setPosts([]);
      return;
    }

    // Guard against out-of-order runs: signing out mid-check must not flip the
    // phase back to "ready".
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;

      if (roleError || data?.role !== "admin") {
        setPhase("denied");
        return;
      }

      setPhase("ready");
      await loadPosts();
    })();

    return () => {
      cancelled = true;
    };
  }, [checked, session, loadPosts]);

  async function signOut() {
    await getSupabase().auth.signOut();
    setView({ kind: "list" });
  }

  async function remove(post: Post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const { error: deleteError } = await getSupabase().from("posts").delete().eq("id", post.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadPosts();
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col gap-3 py-8" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (phase === "signed-out") {
    return <LoginForm />;
  }

  if (phase === "denied") {
    return (
      <div className="card mx-auto max-w-lg p-8">
        <p className="label">Not permitted</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight">This account is not an admin</h1>
        <p className="mt-3 text-sm text-subtle">
          Signed in as{" "}
          <span className="font-mono text-foreground">{session?.user.email}</span>. Ask an existing
          admin to promote this account, then sign in again.
        </p>
        <button type="button" onClick={signOut} className="btn btn-quiet mt-6">
          Sign out
        </button>
      </div>
    );
  }

  const published = posts.filter((post) => post.status === "published").length;
  const drafts = posts.length - published;
  const latest = posts[0];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="label">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Posts</h1>
          <p className="mt-1 font-mono text-xs text-subtle">{session?.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={signOut} className="btn btn-link">
            Sign out
          </button>
          {view.kind === "list" && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView({ kind: "new" });
              }}
              className="btn btn-primary"
            >
              New post
            </button>
          )}
        </div>
      </header>

      {view.kind === "list" && (
        <dl className="mt-6 flex flex-wrap gap-3">
          <Stat label="Total" value={String(posts.length)} />
          <Stat label="Published" value={String(published)} accent />
          <Stat label="Drafts" value={String(drafts)} />
          <Stat
            label="Last update"
            value={latest ? formatDate((latest.published_at ?? latest.updated_at).slice(0, 10)) : "—"}
          />
        </dl>
      )}

      {error && (
        <p
          role="alert"
          className="animate-fade-up mt-4 flex items-start gap-3 rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent"
        >
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="btn btn-link text-accent">
            dismiss
          </button>
        </p>
      )}

      {view.kind === "list" ? (
        <>
          <PostTable
            posts={posts}
            loading={listLoading}
            onEdit={(post) => {
              setError(null);
              setView({ kind: "edit", post });
            }}
            onDelete={remove}
          />
          <p className="mt-4 text-xs text-subtle">
            Published posts appear on the site, its sitemap, and its RSS feed on the next build.
          </p>
        </>
      ) : (
        <PostEditor
          post={view.kind === "edit" ? view.post : null}
          onCancel={() => setView({ kind: "list" })}
          onSaved={async () => {
            await loadPosts();
            setView({ kind: "list" });
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card min-w-[8.5rem] px-4 py-3">
      <dt className="label">{label}</dt>
      <dd className={`mt-1 font-mono text-lg ${accent ? "text-accent" : ""}`}>{value}</dd>
    </div>
  );
}
