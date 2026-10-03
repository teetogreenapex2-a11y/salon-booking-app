import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { notFound } from "next/navigation";
import Link from "next/link";
import StylistPricingForm from "@/components/admin/StylistPricingForm";

export const dynamic = "force-dynamic";

export default async function StylistPricingPage({ params }: { params: { id: string } }) {
  const business = await requireOwner();

  const stylist = await prisma.stylist.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!stylist) notFound();

  const services = await prisma.service.findMany({
    where: { businessId: business.id, active: true },
    orderBy: { name: "asc" },
  });

  const overrides = await prisma.stylistService.findMany({
    where: { stylistId: stylist.id },
  });

  return (
    <div>
      <Link href="/admin/stylists" className="back-link">
        ← Back to stylists
      </Link>
      <h1 className="display" style={{ fontSize: 26, margin: "12px 0 4px" }}>
        {stylist.name}&rsquo;s pricing
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        Leave a field blank to use the business&rsquo;s standard price or duration for that service.
      </p>
      <StylistPricingForm stylistId={stylist.id} services={services} overrides={overrides} />
    </div>
  );
}
