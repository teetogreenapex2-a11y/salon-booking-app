import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import JoinRequestRow from "@/components/admin/JoinRequestRow";
import StylistManager from "@/components/admin/StylistManager";

export const dynamic = "force-dynamic";

export default async function StylistsPage() {
  const business = await requireOwner();

  const stylists = await prisma.stylist.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  // What each stylist actually offers: every active service except those they
  // opted out of (a $0 override means "I don't do this"), with their own
  // price/duration where they set one.
  const [services, overrides] = await Promise.all([
    prisma.service.findMany({ where: { businessId: business.id, active: true }, orderBy: { name: "asc" } }),
    prisma.stylistService.findMany({ where: { stylist: { businessId: business.id } } }),
  ]);
  const offeredByStylist: Record<string, { name: string; priceCents: number; durationMin: number }[]> = {};
  for (const st of stylists) {
    offeredByStylist[st.id] = services
      .map((sv) => {
        const o = overrides.find((x) => x.stylistId === st.id && x.serviceId === sv.id);
        return { name: sv.name, priceCents: o?.priceCents ?? sv.priceCents, durationMin: o?.durationMin ?? sv.durationMin };
      })
      .filter((x) => x.priceCents !== 0);
  }

  const requests = await prisma.joinRequest.findMany({
    where: { businessId: business.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Stylists
      </h1>
      {requests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: 20, marginBottom: 10 }}>Asking to join your salon</h2>
          {requests.map((r) => (
            <JoinRequestRow key={r.id} id={r.id} name={r.name} email={r.email} />
          ))}
        </div>
      )}
      <StylistManager businessId={business.id} initialStylists={stylists} offeredByStylist={offeredByStylist} />
    </div>
  );
}
