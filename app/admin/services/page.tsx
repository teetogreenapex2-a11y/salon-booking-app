import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import ServiceManager from "@/components/admin/ServiceManager";
import DepositToggles from "@/components/admin/DepositToggles";
import ReviewBanner from "@/components/admin/ReviewBanner";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const business = await requireOwner();

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });

  const stylists = await prisma.stylist.findMany({
    where: { businessId: business.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, depositsEnabled: true },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 8 }}>
        Services
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        <a href="/admin/labels" style={{ textDecoration: "underline" }}>Print QR labels</a> so you can scan a service onto a client&apos;s bill.
      </p>
      {business.quickStart && !business.servicesReviewedAt && <ReviewBanner />}
      <DepositToggles salonEnabled={business.depositsEnabled} stylists={stylists} />
      <ServiceManager businessId={business.id} initialServices={services} />
    </div>
  );
}
