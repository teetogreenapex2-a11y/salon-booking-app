import { prisma } from "@/lib/prisma";
import { accentVars } from "@/lib/accent";

// Each salon page installs as that salon's own home-screen app.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { name: true, logoUrl: true },
  });
  if (!business) return {};
  return {
    title: business.name,
    manifest: `/${params.slug}/manifest.webmanifest`,
    icons: { apple: business.logoUrl || "/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: business.name, statusBarStyle: "default" },
  };
}

// Applies the salon's own accent color to everything under /[slug].
export default async function SalonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { accentColor: true },
  });
  return <div style={accentVars(business?.accentColor) as React.CSSProperties}>{children}</div>;
}
