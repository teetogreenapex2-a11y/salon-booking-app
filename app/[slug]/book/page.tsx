export const dynamic = "force-dynamic"; 
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "@/components/BookingFlow";

export default async function BookPage({ params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: {
      services: { where: { active: true } },
      stylists: { where: { active: true } },
    },
  });

  if (!business) notFound();

  return (
    <main className="page">
      <BookingFlow
        businessSlug={business.slug}
        services={business.services}
        stylists={business.stylists}
      />
    </main>
  );
}
