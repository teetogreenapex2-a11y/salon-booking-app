import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CustomersPage() {
  const business = await prisma.business.findFirst();

  if (!business) {
    return <p className="subtle">No business record found — check your seed data.</p>;
  }

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    include: {
      bookings: {
        orderBy: { startsAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Customers
      </h1>
      {customers.length === 0 ? (
        <p className="subtle">No customers yet — they're added automatically the first time someone books.</p>
      ) : (
        <div className="list">
          {customers.map((c) => (
            <Link key={c.id} href={`/admin/customers/${c.id}`} className="card" style={{ display: "block" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <p className="name">{c.name}</p>
                  <p className="subtle" style={{ margin: "2px 0 0" }}>
                    {c.email}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                  {c.notes && (
                    <p className="subtle" style={{ margin: "6px 0 0", fontStyle: "italic" }}>
                      {c.notes.length > 80 ? c.notes.slice(0, 80) + "…" : c.notes}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {c.bookings[0] && (
                    <p className="subtle" style={{ margin: 0 }}>
                      Last visit:{" "}
                      {c.bookings[0].startsAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {c.noShowCount > 0 && (
                    <p className="subtle" style={{ margin: "2px 0 0", color: "#b3261e" }}>
                      {c.noShowCount} no-show{c.noShowCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
