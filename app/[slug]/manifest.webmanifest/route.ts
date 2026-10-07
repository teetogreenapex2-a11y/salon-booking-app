import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// A home-screen "app" for ONE salon: its name, its logo, and opening
// straight to its booking page — what a customer installs.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { name: true, logoUrl: true, accentColor: true },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logo = business.logoUrl
    ? [
        {
          src: business.logoUrl,
          sizes: "512x512",
          type: /\.jpe?g(\?|$)/i.test(business.logoUrl) ? "image/jpeg" : "image/png",
          purpose: "any",
        },
      ]
    : [];

  const manifest = {
    name: business.name,
    short_name: business.name.length > 12 ? business.name.slice(0, 12).trim() : business.name,
    start_url: `/${params.slug}`,
    scope: "/",
    display: "standalone",
    background_color: "#e9e0e3",
    theme_color: business.accentColor || "#7f2d4a",
    icons: [
      ...logo,
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
