import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 26, margin: 0 }}>
          Customers
        </h1>
        <Link href="/admin/customers/import" className="btn-primary" style={{ textDecoration: "none" }}>
          Import customers
        </Link>
      </div>
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
