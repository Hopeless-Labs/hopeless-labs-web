import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

// Required for `output: export` — emit this route as a static file.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    // Installable icon set. `app/icon.png` + `app/apple-icon.png` cover the
    // browser/Apple tab and home-screen cases via Next's file conventions;
    // these are the Android/desktop PWA entries declared explicitly.
    icons: [
      { src: "/favicon-32.png", sizes: "32x32", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
