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
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Services
      </h1>
      <ServiceManager businessId={business.id} initialServices={services} />
    </div>
  );
}
