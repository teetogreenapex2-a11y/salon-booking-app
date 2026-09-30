import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function AdminReports({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  if (searchParams.month) {
    const [y, m] = searchParams.month.split("-").map(Number);
    if (y && m) {
      year = y;
      monthIndex = m - 1;
    }
  }

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);

  const prevMonth = new Date(year, monthIndex - 1, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const [stylists, bookings] = await Promise.all([
    prisma.stylist.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        startsAt: { gte: monthStart, lt: monthEnd },
      },
      include: { service: true },
    }),
  ]);

  const stats = new Map<
    string,
    { name: string; completed: number; revenueCents: number; noShows: number; cancelled: number }
  >();
  for (const s of stylists) {
    stats.set(s.id, { name: s.name, completed: 0, revenueCents: 0, noShows: 0, cancelled: 0 });
  }

  for (const b of bookings) {
    const entry = stats.get(b.stylistId);
    if (!entry) continue;
    if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
      entry.completed += 1;
      entry.revenueCents += b.service.priceCents;
    } else if (b.status === "NO_SHOW") {
      entry.noShows += 1;
    } else if (b.status === "CANCELLED") {
      entry.cancelled += 1;
    }
  }

  const rows = [...stats.values()].sort((a, b) => b.revenueCents - a.revenueCents);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenueCents, 0);
  const totalBookings = rows.reduce((sum, r) => sum + r.completed, 0);

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Reports
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        Revenue and bookings by stylist
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href={`/admin/reports?month=${monthParam(prevMonth)}`} className="icon-btn">
          ←
        </Link>
        <span style={{ fontWeight: 600, minWidth: 160, textAlign: "center" }}>
          {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <Link href={`/admin/reports?month=${monthParam(nextMonth)}`} className="icon-btn">
          →
        </Link>
      </div>

      <div className="stat-row" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <span className="stat-number">{formatCents(totalRevenue)}</span>
          <span className="subtle">Total revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalBookings}</span>
          <span className="subtle">Bookings</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="subtle">No active stylists.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Stylist</th>
              <th>Bookings</th>
              <th>Revenue</th>
              <th>No-shows</th>
              <th>Cancelled</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.completed}</td>
                <td>{formatCents(r.revenueCents)}</td>
                <td style={r.noShows > 0 ? { color: "#b3261e" } : undefined}>{r.noShows}</td>
                <td>{r.cancelled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
