import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import CancelBookingButton from "@/components/CancelBookingButton";
import MarkNoShowButton from "@/components/admin/MarkNoShowButton";
import ChargeNoShowFeeButton from "@/components/admin/ChargeNoShowFeeButton";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  const bookings = await prisma.booking.findMany({
    where: { businessId: business.id },
    orderBy: { startsAt: "desc" },
    include: { service: true, stylist: true, customer: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Bookings
      </h1>
      {bookings.length === 0 ? (
        <p className="subtle">No bookings yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Stylist</th>
                <th>When</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>
                    {b.customerEmail}
                    {b.customerPhone ? ` · ${b.customerPhone}` : ""}
                  </td>
                  <td>{b.service.name}</td>
                  <td>{b.stylist.name}</td>
                  <td>
                    {b.startsAt.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className={`status-pill status-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                    {b.noShowFeeChargedAt && (
                      <div className="subtle" style={{ fontSize: 11, marginTop: 2 }}>
                        Fee charged
                      </div>
                    )}
                  </td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {b.status === "CONFIRMED" && (
                      <>
                        <CancelBookingButton id={b.id} />
                        <MarkNoShowButton id={b.id} />
                      </>
                    )}
                    {b.status === "NO_SHOW" &&
                      !b.noShowFeeChargedAt &&
                      b.customer?.stripePaymentMethodId && (
                        <ChargeNoShowFeeButton id={b.id} feeCents={business.noShowFeeCents} />
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
