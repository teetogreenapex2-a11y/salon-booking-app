import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import ServiceManager from "@/components/admin/ServiceManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

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
