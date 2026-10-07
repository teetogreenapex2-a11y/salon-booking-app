import { prisma } from "@/lib/prisma";
import { accentVars } from "@/lib/accent";

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
