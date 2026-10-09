import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lists the home page, the directory, and every salon that has chosen to
// be listed, so search engines can find them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://hairsalonix.com";
  const salons = await prisma.business.findMany({
    where: { listed: true },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/find`, changeFrequency: "daily", priority: 0.8 },
    ...salons.map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
