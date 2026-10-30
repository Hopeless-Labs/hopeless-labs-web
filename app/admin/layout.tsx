import type { Metadata } from "next";

// Staff-only screen: never index it, and keep it out of the sitemap (the
// sitemap lists routes explicitly, so /admin is already absent there).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">{children}</div>;
}
