import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StylistPricingForm from "@/components/admin/StylistPricingForm";

export const dynamic = "force-dynamic";

export default async function StylistPricingPage({ params }: { params: { id: string } }) {
  const access = await requireOwnerOrStylist();
  const business = access.business!;

  // A stylist account can only reach their OWN pricing page — trying
  // another stylist's id (by editing the URL) sends them back to their
  // own instead of a dead end or an error.
  if (access.role === "stylist" && access.stylist.id !== params.id) {
    redirect(`/admin/stylists/${access.stylist.id}/pricing`);
  }

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
      <Link
        href={access.role === "stylist" ? "/admin/calendar" : "/admin/stylists"}
        className="back-link"
      >
        ← {access.role === "stylist" ? "Back to calendar" : "Back to stylists"}
      </Link>
      <h1 className="display" style={{ fontSize: 26, margin: "12px 0 4px" }}>
        {access.role === "stylist" ? "Your pricing" : `${stylist.name}’s pricing`}
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        Leave a field blank to use the business&rsquo;s standard price or duration for that service.
      </p>
      <StylistPricingForm stylistId={stylist.id} services={services} overrides={overrides} />
    </div>
  );
}
