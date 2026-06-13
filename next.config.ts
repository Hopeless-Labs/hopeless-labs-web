import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes a self-contained `out/`
  // directory of HTML/CSS/JS that any static host (or CDN) can serve.
  output: "export",
  // No image optimization server in a static export — emit <img> as-is.
  images: { unoptimized: true },
  // Emit `/about/index.html` instead of `/about.html` so clean URLs
  // (without a trailing `.html`) resolve on plain static hosts.
  trailingSlash: true,
};

export default nextConfig;
