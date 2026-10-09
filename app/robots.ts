import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/manage"] },
    sitemap: "https://hairsalonix.com/sitemap.xml",
  };
}
