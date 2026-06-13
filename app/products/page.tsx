import type { Metadata } from "next";

import { PRODUCTS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Products",
  description:
    "The Ruso ecosystem: a scripting language for security checks, a fast runtime and CLI, and a public script registry.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: `Products · ${SITE.name}`,
    description:
      "The Ruso ecosystem: scripting language, runtime, CLI, and registry.",
    url: `${SITE.url}/products`,
  },
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="font-mono text-sm text-accent">Products</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          The Ruso ecosystem
        </h1>
        <p className="mt-4 text-lg text-subtle">
          Ruso is everything you need to write, run, and share a vulnerability
          check. Each piece does one job and hands off cleanly to the next.
        </p>
      </header>

      <div className="mt-12 flex flex-col gap-4">
        {PRODUCTS.map((product, i) => (
          <article
            key={product.slug}
            className="rounded-xl border border-border p-6 sm:p-8"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-semibold">{product.name}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-subtle">{product.description}</p>
            {product.href && (
              <a
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-strong"
              >
                {product.hrefLabel} →
              </a>
            )}
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-xl border border-border bg-muted/40 p-8 text-center">
        <h2 className="text-xl font-semibold">Ready to try it?</h2>
        <p className="mx-auto mt-2 max-w-xl text-subtle">
          The documentation covers installation, the language, and the CLI from
          first install to advanced scans.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={SITE.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
          >
            Read the docs
          </a>
          <a
            href={SITE.registry}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent hover:text-accent"
          >
            Browse the registry
          </a>
        </div>
      </section>
    </div>
  );
}
