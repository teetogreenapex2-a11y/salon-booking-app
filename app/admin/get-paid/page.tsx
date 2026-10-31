import { fmtInTz } from "@/lib/tz";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import CollectPaymentButton from "@/components/admin/CollectPaymentButton";
import SellProductsButton from "@/components/admin/SellProductsButton";
import { canSellProduct } from "@/lib/productScope";
import StylistPaymentOptions from "@/components/admin/StylistPaymentOptions";

export const dynamic = "force-dynamic";

// A stylist's own "get paid" page: set their Venmo / Cash App / Zelle, and
// collect from recent clients. Owners already have all of this on the
// Bookings and Stylists pages, so they're sent there.
export default async function GetPaidPage() {
  const access = await requireOwnerOrStylist();
  if (access.role === "owner") redirect("/admin/bookings");

  const stylist = access.stylist;

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const bookings = await prisma.booking.findMany({
    where: {
      stylistId: stylist.id,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      startsAt: { gte: since, lte: endOfToday },
    },
    include: { service: true, sale: true },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  const allProducts = await prisma.product.findMany({
    where: { businessId: stylist.businessId, active: true },
    orderBy: { name: "asc" },
  });
  const sellable = allProducts.filter((p) => canSellProduct(p, stylist));

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Get paid
      </h1>

      <StylistPaymentOptions
        venmoHandle={stylist.venmoHandle}
        cashAppHandle={stylist.cashAppHandle}
        zelleInfo={stylist.zelleInfo}
      />

      <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>
        Recent clients
      </h2>
      {bookings.length === 0 ? (
        <p className="subtle">No appointments in the last two weeks.</p>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="card static"
              style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
            >
              <div>
                <p className="name" style={{ margin: 0 }}>{b.customerName}</p>
                <p className="subtle" style={{ margin: "2px 0 0", fontSize: 12 }}>
                  {b.service.name} ·{" "}
                  {fmtInTz(b.startsAt, access.business.timezone, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <CollectPaymentButton
                bookingId={b.id}
                totalCents={b.priceCents}
                note={`${b.service.name} with ${stylist.name}`}
                venmoHandle={stylist.venmoHandle}
                cashAppHandle={stylist.cashAppHandle}
                zelleInfo={stylist.zelleInfo}
                paidMethod={b.paidOutsideMethod}
                creditCents={b.giftCardCents}
                depositCents={b.depositRefundedAt ? 0 : b.depositCents}
                tipCents={b.tipCents}
              />
              {!b.sale && sellable.length > 0 && <SellProductsButton bookingId={b.id} products={sellable} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
