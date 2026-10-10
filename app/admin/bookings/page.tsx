import { displayEmail } from "@/lib/placeholderEmail";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { resolvePayoutAccountId } from "@/lib/stripe";
import CancelBookingButton from "@/components/CancelBookingButton";
import MarkNoShowButton from "@/components/admin/MarkNoShowButton";
import ChargeNoShowFeeButton from "@/components/admin/ChargeNoShowFeeButton";
import SellProductsButton from "@/components/admin/SellProductsButton";
import CollectPaymentButton from "@/components/admin/CollectPaymentButton";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const business = await requireOwner();

  const [bookings, products] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id },
      orderBy: { startsAt: "desc" },
      include: { service: true, stylist: true, customer: true, sale: true },
      take: 100,
    }),
    prisma.product.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // A booking's "do they have a card on file" question depends on which
  // connected account THAT booking's stylist pays out to — a card saved
  // under the salon's account doesn't carry over to a booth renter's own
  // account, or vice versa. Batch-fetch every card this page's bookings
  // could possibly need in one query rather than one per row.
  const customerIds = [...new Set(bookings.map((b) => b.customerId).filter((id): id is string => !!id))];
  const cardRows = customerIds.length
    ? await prisma.customerCard.findMany({ where: { customerId: { in: customerIds } } })
    : [];
  const cardFor = (customerId: string | null, accountId: string | null) =>
    customerId && accountId
      ? cardRows.find((c) => c.customerId === customerId && c.connectedAccountId === accountId)
      : undefined;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 26, margin: 0 }}>
          Bookings
        </h1>
        <a href="/admin/book" className="btn-primary" style={{ textDecoration: "none", padding: "9px 16px", fontSize: 14 }}>
          + New booking
        </a>
      </div>
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
              {bookings.map((b) => {
                const accountId = resolvePayoutAccountId(b.stylist, business);
                const card = cardFor(b.customerId, accountId);
                const hasCard = !!card?.stripePaymentMethodId;
                return (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>
                    {displayEmail(b.customerEmail)}
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
                    {b.status === "NO_SHOW" && !b.noShowFeeChargedAt && hasCard && (
                      <ChargeNoShowFeeButton id={b.id} feeCents={business.noShowFeeCents} />
                    )}
                    {b.status !== "CANCELLED" && !b.sale && hasCard && products.length > 0 && (
                      <SellProductsButton bookingId={b.id} products={products} />
                    )}
                    {b.status !== "CANCELLED" && b.status !== "NO_SHOW" && (
                      <CollectPaymentButton
                        bookingId={b.id}
                        totalCents={b.priceCents + (b.sale?.totalCents ?? 0)}
                        note={`${b.service.name} with ${b.stylist.name}`}
                        venmoHandle={b.stylist.venmoHandle}
                        cashAppHandle={b.stylist.cashAppHandle}
                        zelleInfo={b.stylist.zelleInfo}
                        paidMethod={b.paidOutsideMethod}
                        creditCents={b.giftCardCents}
                      />
                    )}
                    {b.sale && (
                      <span className="subtle" style={{ fontSize: 11 }}>
                        Products: ${(b.sale.totalCents / 100).toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
