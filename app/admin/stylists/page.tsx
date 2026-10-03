import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import StylistManager from "@/components/admin/StylistManager";

export const dynamic = "force-dynamic";

export default async function StylistsPage() {
  const business = await requireOwner();

  const stylists = await prisma.stylist.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Stylists
      </h1>
      <StylistManager businessId={business.id} initialStylists={stylists} />
    </div>
  );
}
