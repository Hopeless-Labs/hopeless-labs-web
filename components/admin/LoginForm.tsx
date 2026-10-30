"use client";

import { useState } from "react";

import { getSupabase } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center py-6 sm:py-16">
      <p className="font-mono text-sm text-accent">Admin</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-subtle">
        Staff accounts are managed in Supabase Auth.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate={false}>
        <label className="block">
          <span className="label">Email</span>
          <input
            type="email"
            required
            autoFocus
            autoComplete="username"
            placeholder="you@hopeless-labs.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-1.5"
          />
        </label>

        <label className="block">
          <span className="label">Password</span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="btn btn-link absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "hide" : "show"}
            </button>
          </div>
        </label>

        {error && (
          <p
            role="alert"
            className="animate-fade-up rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary mt-2 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
