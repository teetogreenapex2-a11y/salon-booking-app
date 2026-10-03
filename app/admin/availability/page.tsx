import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import AvailabilityManager from "@/components/admin/AvailabilityManager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const access = await requireOwnerOrStylist();
  const business = access.business!;

  // A stylist account only ever sees (and can only save) their own hours.
  const stylists =
    access.role === "stylist"
      ? await prisma.stylist.findMany({
          where: { id: access.stylist.id },
          include: { availability: true },
        })
      : await prisma.stylist.findMany({
          where: { businessId: business.id, active: true },
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
