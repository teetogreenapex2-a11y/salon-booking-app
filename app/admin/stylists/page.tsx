import { prisma } from "@/lib/prisma";
import StylistManager from "@/components/admin/StylistManager";

export default async function StylistsPage() {
  const business = await prisma.business.findFirst();
  const stylists = await prisma.stylist.findMany({
    where: { businessId: business?.id },
    orderBy: { createdAt: "asc" },
  });

  if (!business) {
    return <p className="subtle">No business record found — check your seed data.</p>;
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Stylists
      </h1>
      <StylistManager businessId={business.id} initialStylists={stylists} />
    </div>
  );
}
