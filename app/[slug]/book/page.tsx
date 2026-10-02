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

  const overrides = await prisma.stylistService.findMany({
    where: { stylist: { businessId: business.id } },
    select: { stylistId: true, serviceId: true, priceCents: true, durationMin: true },
  });

  return (
    <main className="page">
      <BookingFlow
        businessSlug={business.slug}
        services={business.services}
        stylists={business.stylists}
        overrides={overrides}
      />
    </main>
  );
}
