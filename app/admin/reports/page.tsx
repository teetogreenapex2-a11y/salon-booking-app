import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import Link from "next/link";

export const dynamic = "force-dynamic";

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

type StylistRow = {
  name: string;
  completed: number;
  revenueCents: number;
  noShows: number;
  cancelled: number;
};

async function statsForRange(businessId: string, start: Date, end: Date, stylists: { id: string; name: string }[]) {
  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      startsAt: { gte: start, lt: end },
    },
    include: { service: true },
  });

  const stats = new Map<string, StylistRow>();
  for (const s of stylists) {
    stats.set(s.id, { name: s.name, completed: 0, revenueCents: 0, noShows: 0, cancelled: 0 });
  }

  for (const b of bookings) {
    const entry = stats.get(b.stylistId);
    if (!entry) continue;
    if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
      entry.completed += 1;
      entry.revenueCents += b.priceCents || b.service.priceCents;
    } else if (b.status === "NO_SHOW") {
      entry.noShows += 1;
    } else if (b.status === "CANCELLED") {
      entry.cancelled += 1;
    }
  }

  return [...stats.values()].sort((a, b) => b.revenueCents - a.revenueCents);
}

type RetailRow = { name: string; units: number; revenueCents: number; costCents: number };

// Product sales in a date range: units, revenue, cost of goods and profit.
// Cost comes from the snapshot saved on each sale (older sales before costs
// were entered count as $0 cost).
async function retailForRange(businessId: string, start: Date, end: Date) {
  const items = await prisma.saleItem.findMany({
    where: { sale: { businessId, createdAt: { gte: start, lt: end } } },
    include: { product: true },
  });
  const map = new Map<string, RetailRow>();
  for (const it of items) {
    const row = map.get(it.productId) ?? { name: it.product.name, units: 0, revenueCents: 0, costCents: 0 };
    row.units += it.quantity;
    row.revenueCents += it.quantity * it.priceCentsEach;
    row.costCents += it.quantity * it.costCentsEach;
    map.set(it.productId, row);
  }
  return [...map.values()].sort((a, b) => b.revenueCents - a.revenueCents);
}

function RetailTable({ rows }: { rows: RetailRow[] }) {
  if (rows.length === 0) return <p className="subtle">No product sales in this period.</p>;
  const revenue = rows.reduce((n, r) => n + r.revenueCents, 0);
  const cost = rows.reduce((n, r) => n + r.costCents, 0);
  return (
    <>
      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-number">${(revenue / 100).toFixed(0)}</span>
          <span className="subtle">Product sales</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">${(cost / 100).toFixed(0)}</span>
          <span className="subtle">Cost of products</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">${((revenue - cost) / 100).toFixed(0)}</span>
          <span className="subtle">Profit</span>
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Sold</th>
            <th>Sales</th>
            <th>Cost</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.units}</td>
              <td>${(r.revenueCents / 100).toFixed(2)}</td>
              <td>${(r.costCents / 100).toFixed(2)}</td>
              <td>${((r.revenueCents - r.costCents) / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function StatsTable({ rows }: { rows: StylistRow[] }) {
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenueCents, 0);
  const totalBookings = rows.reduce((sum, r) => sum + r.completed, 0);

  return (
    <>
      <div className="stat-row" style={{ marginBottom: 16 }}>
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
    </>
  );
}

export default async function AdminReports({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const access = await requireOwnerOrStylist();
  const business = access.business!;

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

  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const ytdEnd = new Date(now.getFullYear() + 1, 0, 1);

  // A stylist account only ever sees their own row in every table below —
  // forced here server-side, not just in how the table is rendered.
  const stylists =
    access.role === "stylist"
      ? [access.stylist]
      : await prisma.stylist.findMany({
          where: { businessId: business.id, active: true },
          orderBy: { name: "asc" },
        });

  const [mtdRows, ytdRows, browsedMonthRows] = await Promise.all([
    statsForRange(business.id, mtdStart, mtdEnd, stylists),
    statsForRange(business.id, ytdStart, ytdEnd, stylists),
    statsForRange(business.id, monthStart, monthEnd, stylists),
  ]);

  const isOwner = access.role !== "stylist";
  const [retailMtd, retailMonth, lowStock, stockValueItems] = isOwner
    ? await Promise.all([
        retailForRange(business.id, mtdStart, mtdEnd),
        retailForRange(business.id, monthStart, monthEnd),
        prisma.product.findMany({ where: { businessId: business.id, active: true }, orderBy: { name: "asc" } }),
        prisma.product.findMany({ where: { businessId: business.id }, select: { stockQty: true, costCents: true } }),
      ])
    : [[], [], [], []];
  const lowList = (lowStock as any[]).filter((p) => p.stockQty <= p.lowStockAt);
  const inventoryCost = (stockValueItems as any[]).reduce((n, p) => n + p.stockQty * p.costCents, 0);

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Reports
      </h1>
      <p className="subtle" style={{ marginBottom: 28 }}>
        {access.role === "stylist" ? "Your revenue and bookings" : "Revenue and bookings by stylist"}
      </p>

      <h2 className="display" style={{ fontSize: 18, marginBottom: 2 }}>
        Month to date
      </h2>
      <p className="subtle" style={{ marginBottom: 14 }}>
        {mtdStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} – today
      </p>
      <div style={{ marginBottom: 36 }}>
        <StatsTable rows={mtdRows} />
      </div>

      <h2 className="display" style={{ fontSize: 18, marginBottom: 2 }}>
        Year to date
      </h2>
      <p className="subtle" style={{ marginBottom: 14 }}>
        Jan 1 – today, {now.getFullYear()}
      </p>
      <div style={{ marginBottom: 36 }}>
        <StatsTable rows={ytdRows} />
      </div>

      <h2 className="display" style={{ fontSize: 18, marginBottom: 2 }}>
        By month
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 16px" }}>
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
      <StatsTable rows={browsedMonthRows} />

      {isOwner && (
        <>
          <h2 className="display" style={{ fontSize: 18, margin: "40px 0 2px" }}>
            Retail products: this month
          </h2>
          <p className="subtle" style={{ marginBottom: 14 }}>
            Sales, cost and profit from products sold at checkout
          </p>
          <div style={{ marginBottom: 36 }}>
            <RetailTable rows={retailMtd as RetailRow[]} />
          </div>

          <h2 className="display" style={{ fontSize: 18, marginBottom: 2 }}>
            Retail products: {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <div style={{ margin: "14px 0 36px" }}>
            <RetailTable rows={retailMonth as RetailRow[]} />
          </div>

          <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>
            Inventory
          </h2>
          <p className="subtle" style={{ marginBottom: 10 }}>
            Value of stock on hand at your cost: <strong>${(inventoryCost / 100).toFixed(2)}</strong>
          </p>
          {lowList.length === 0 ? (
            <p className="subtle">Nothing is running low.</p>
          ) : (
            <div>
              <p style={{ color: "#b3261e", fontWeight: 600, marginBottom: 6 }}>Running low:</p>
              {lowList.map((p: any) => (
                <p key={p.id} style={{ margin: "2px 0" }}>
                  {p.name} — {p.stockQty === 0 ? "out of stock" : `${p.stockQty} left`}
                </p>
              ))}
              <Link href="/admin/products" className="btn-ghost" style={{ display: "inline-block", marginTop: 10, textDecoration: "none" }}>
                Restock on the Products page
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
