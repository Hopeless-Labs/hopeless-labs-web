import Link from "next/link";

import { PRODUCTS, SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <p className="font-mono text-sm text-accent">{SITE.name}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Security tooling for people who read the source.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-subtle">
          We build <strong className="text-foreground">Ruso</strong> — an open
          vulnerability-scanning ecosystem. Write a small script that asks one
          security question, run it from your terminal or CI, and get a
          structured answer.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
          >
            Explore the ecosystem
          </Link>
          <a
            href={SITE.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent hover:text-accent"
          >
            Read the docs
          </a>
        </div>
      </section>

      {/* Code sample */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-border" />
            <span className="h-3 w-3 rounded-full bg-border" />
            <span className="h-3 w-3 rounded-full bg-border" />
            <span className="ml-2 font-mono text-xs text-subtle">
              redis-exposed.rsl
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
            <code>{`name "Exposed Redis"
severity high

tcp redis { host "{{scan_host}}" port 6379 }

send redis
redis.write "PING\\r\\n"
match redis.response contains "+PONG"   # no auth required`}</code>
          </pre>
        </div>
        <p className="mt-3 text-center text-sm text-subtle">
          One file, one question. Compile it, ship it, install it from the
          registry.
        </p>
      </section>

      {/* Principles */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          <Principle
            title="Small and readable"
            body="Scripts are plain text describing probes and matches. No framework, no boilerplate — diff them, review them, version them."
          />
          <Principle
            title="Fast and portable"
            body="Source compiles to compact bytecode that a tiny runtime executes. The same artifact runs locally, in CI, and from the registry."
          />
          <Principle
            title="Open and shared"
            body="Publish a check once and anyone can install it. The registry turns one person's research into everyone's tooling."
          />
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          The Ruso ecosystem
        </h2>
        <p className="mt-3 max-w-2xl text-subtle">
          Four pieces that fit together: a language to express checks, a runtime
          and CLI to run them, and a registry to share them.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article
              key={product.slug}
              className="flex flex-col rounded-xl border border-border p-6 transition-colors hover:border-accent"
            >
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="mt-2 flex-1 text-sm text-subtle">
                {product.summary}
              </p>
              {product.href && (
                <a
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-medium text-accent hover:text-accent-strong"
                >
                  {product.hrefLabel} →
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/products"
            className="text-sm font-medium text-accent hover:text-accent-strong"
          >
            See what each piece does →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Start scanning in minutes.
            </h2>
            <p className="mt-2 text-subtle">
              The quick start walks you from install to your first finding.
            </p>
          </div>
          <a
            href={`${SITE.docs}/guide/quick-start.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
          >
            Quick start
          </a>
        </div>
      </section>
    </>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-subtle">{body}</p>
    </div>
  );
}
