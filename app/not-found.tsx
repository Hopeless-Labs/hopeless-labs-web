import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-32 text-center">
      <p className="font-mono text-5xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-subtle">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:bg-accent-strong"
      >
        Back home
      </Link>
    </div>
  );
}
