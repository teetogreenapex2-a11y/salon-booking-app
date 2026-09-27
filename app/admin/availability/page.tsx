import { prisma } from "@/lib/prisma";
import AvailabilityManager from "@/components/admin/AvailabilityManager";

export default async function AvailabilityPage() {
  const business = await prisma.business.findFirst();
  const stylists = await prisma.stylist.findMany({
    where: { businessId: business?.id, active: true },
    include: { availability: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Hours
      </h1>
      <AvailabilityManager stylists={stylists} />
    </div>
  );
}
