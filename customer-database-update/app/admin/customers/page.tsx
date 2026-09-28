import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const business = await prisma.business.findFirst();
  if (!business) {
    return <p className="subtle">No business set up yet.</p>;
  }

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    include: {
      _count: { select: { bookings: true } },
      preferredStylist: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Customers
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        {customers.length} total
      </p>

      {customers.length === 0 ? (
        <p className="subtle">No customers yet.</p>
      ) : (
        <div className="list">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="card static"
              style={{ justifyContent: "space-between", textDecoration: "none", color: "inherit" }}
            >
              <div className="avatar">{c.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <p className="name">{c.name}</p>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="subtle" style={{ margin: 0 }}>
                  {c._count.bookings} visit{c._count.bookings === 1 ? "" : "s"}
                </p>
                {c.preferredStylist && (
                  <p className="subtle" style={{ margin: "2px 0 0" }}>
                    Prefers {c.preferredStylist.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
