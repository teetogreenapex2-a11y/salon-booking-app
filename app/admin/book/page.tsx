import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import { resolvePayoutAccountId } from "@/lib/stripe";
import NewBooking from "@/components/admin/NewBooking";

export const dynamic = "force-dynamic";

// Book an appointment for someone: an existing customer, or a brand-new one
// (a walk-in). Owners can book with any stylist; a stylist account books on
// their own calendar and only sees customers who've booked with them.
export default async function NewBookingPage() {
  const access = await requireOwnerOrStylist();
  const business = access.business!;
  const isStylist = access.role === "stylist";

  const [services, stylists, overrides, customers] = await Promise.all([
    prisma.service.findMany({ where: { businessId: business.id, active: true } }),
    prisma.stylist.findMany({
      where: isStylist
        ? { id: access.stylist.id }
        : { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.stylistService.findMany({
      where: { stylist: { businessId: business.id } },
      select: { stylistId: true, serviceId: true, priceCents: true, durationMin: true },
    }),
    prisma.customer.findMany({
      where: isStylist
        ? { businessId: business.id, bookings: { some: { stylistId: access.stylist.id } } }
        : { businessId: business.id },
      orderBy: { name: "asc" },
      take: 1000,
      include: { cards: true },
    }),
  ]);

  // Which customers already have a usable card under which stylist's account.
  const cardKeys: Record<string, boolean> = {};
  for (const c of customers) {
    for (const sty of stylists) {
      const accountId = resolvePayoutAccountId(sty, business);
      cardKeys[`${c.id}:${sty.id}`] = c.cards.some(
        (card) => card.connectedAccountId === accountId && !!card.stripePaymentMethodId
      );
    }
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 6 }}>
        New booking
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        Book someone in yourself — pick an existing customer or add a new one.
      </p>
      <NewBooking
        businessSlug={business.slug}
        services={services}
        stylists={stylists}
        overrides={overrides}
        customers={customers.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone }))}
        cardKeys={cardKeys}
        afterBookingHref={isStylist ? "/admin/calendar" : "/admin/bookings"}
      />
    </div>
  );
}
