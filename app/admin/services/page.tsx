import { prisma } from "@/lib/prisma";
import ServiceManager from "@/components/admin/ServiceManager";

export default async function ServicesPage() {
  const business = await prisma.business.findFirst();
  const services = await prisma.service.findMany({
    where: { businessId: business?.id },
    orderBy: { name: "asc" },
  });

  if (!business) {
    return <p className="subtle">No business record found — check your seed data.</p>;
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Services
      </h1>
      <ServiceManager businessId={business.id} initialServices={services} />
    </div>
  );
}
