import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import CustomerEditForm from "@/components/CustomerEditForm";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { booked?: string };
}) {
  const business = await prisma.business.findFirst();
  if (!business) {
    return <p className="subtle">No business set up yet.</p>;
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, businessId: business.id },
  });

  if (!customer) notFound();

  const [stylists, bookings] = await Promise.all([
    prisma.stylist.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: { customerId: customer.id },
      include: { service: true, stylist: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  return (
    <div>
      <Link href="/admin/customers" className="back-link" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Customers
      </Link>

      {searchParams.booked && (
        <div
          className="card static"
          style={{ marginTop: 12, background: "var(--blush)", borderColor: "var(--berry)" }}
        >
          <p className="name" style={{ margin: 0 }}>Next appointment booked</p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginTop: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display" style={{ fontSize: 24, margin: 0 }}>
              {customer.name}
            </h1>
            <p className="subtle" style={{ margin: "2px 0 0" }}>
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
            <p className="subtle" style={{ margin: "2px 0 0" }}>
              {bookings.length} visit{bookings.length === 1 ? "" : "s"}
              {customer.noShowCount > 0 && (
                <span style={{ color: "#b3261e" }}>
                  {" · "}
                  {customer.noShowCount} no-show{customer.noShowCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/customers/${customer.id}/book`}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <CalendarPlus size={16} /> Book next appointment
        </Link>
      </div>

      <CustomerEditForm customer={customer} stylists={stylists} />

      <h2 className="display" style={{ fontSize: 18, margin: "32px 0 12px" }}>
        Booking history
      </h2>
      {bookings.length === 0 ? (
        <p className="subtle">No bookings yet.</p>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <div key={b.id} className="card static" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="name">{b.service.name}</p>
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
              <span className={`status-pill status-${b.status.toLowerCase()}`}>
                {b.status.toLowerCase().replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
