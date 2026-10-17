import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import ServiceManager from "@/components/admin/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const business = await requireOwner();

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 8 }}>
        Services
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        <a href="/admin/labels" style={{ textDecoration: "underline" }}>Print QR labels</a> so you can scan a service onto a client&apos;s bill.
      </p>
      <ServiceManager businessId={business.id} initialServices={services} />
    </div>
  );
}
