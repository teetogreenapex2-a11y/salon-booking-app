import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [business, stylistCount, serviceCount, upcomingBookings] = await Promise.all([
    prisma.business.findFirst(),
    prisma.stylist.count({ where: { active: true } }),
    prisma.service.count({ where: { active: true } }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { service: true, stylist: true },
    }),
  ]);

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        {business?.name ?? "Your salon"}
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Overview
      </p>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-number">{stylistCount}</span>
          <span className="subtle">Active stylists</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{serviceCount}</span>
          <span className="subtle">Services offered</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{upcomingBookings.length}</span>
          <span className="subtle">Upcoming bookings</span>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: 20, margin: "32px 0 12px" }}>
        Next up
      </h2>
      {upcomingBookings.length === 0 ? (
        <p className="subtle">No upcoming bookings yet.</p>
      ) : (
        <div className="list">
          {upcomingBookings.map((b) => (
            <div key={b.id} className="card static" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="name">
                  {b.customerName} — {b.service.name}
                </p>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  with {b.stylist.name} ·{" "}
                  {b.startsAt.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/admin/bookings" className="subtle">
          See all bookings
        </Link>
      </p>
    </div>
  );
}
