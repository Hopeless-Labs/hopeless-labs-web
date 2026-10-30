import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Hosted Supabase project: pzyurpyqlsguvtexvpce.
// This site is a static export (`output: "export"`), so nothing of ours runs on
// a server after deploy. That leaves two ways to reach the database:
//
//   getSupabase()      publishable key — safe to ship in the browser bundle.
//                      Everything it can do is decided by Row Level Security,
//                      so tables are private until a policy says otherwise.
//   getSupabaseAdmin() secret key — bypasses RLS. Use it only from code that
//                      runs at build time (Server Components, route handlers
//                      during `next build`, or a Node script). Importing it
//                      into a Client Component would inline the key into
//                      public JavaScript.
//
// Env comes from `.env.local` (gitignored); see `.env.example`.
//
// NOTE: every env var below is referenced as a static `process.env.NAME`
// member expression on purpose. Next only substitutes NEXT_PUBLIC_* when it
// sees that exact form; a dynamic lookup like `process.env[name]` survives
// into the bundle as `undefined` in the browser and throws at runtime.

type Client = SupabaseClient<Database>;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} — copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

let publicClient: Client | null = null;
let adminClient: Client | null = null;

/** Shared publishable-key client (browser or build time). */
export function getSupabase(): Client {
  if (!publicClient) {
    publicClient = createClient<Database>(
      required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      required(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ),
      { auth: { persistSession: true } },
    );
  }
  return publicClient;
}

/** Secret-key client. Build time / Node scripts only — never import from a Client Component. */
export function getSupabaseAdmin(): Client {
  if (!adminClient) {
    adminClient = createClient<Database>(
      required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      required(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return adminClient;
}
