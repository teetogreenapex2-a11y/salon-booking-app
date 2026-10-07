import type { MetadataRoute } from "next";

// Lets people "Add to Home Screen" and open Hairsalonix like an app: no
// browser address bar or toolbar, so the bottom tab bar stays put.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hairsalonix",
    short_name: "Hairsalonix",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#e9e0e3",
    theme_color: "#e9e0e3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
