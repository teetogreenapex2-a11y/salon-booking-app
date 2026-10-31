import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

// Who is managing products: the owner (salon-wide products, stylistId null)
// or a stylist login (only their own). `scope` drops straight into a Prisma
// where clause so neither side can touch the other's products.
export async function getProductActor() {
  const business = await getCurrentBusiness();
  if (business) return { business, stylistId: null as string | null, scope: { businessId: business.id, stylistId: null as string | null } };
  const stylist = await getCurrentStylist();
  if (stylist) {
    return { business: stylist.business, stylistId: stylist.id as string | null, scope: { businessId: stylist.businessId, stylistId: stylist.id as string | null } };
  }
  return null;
}

// Which products can be sold on a booking with this stylist. A booth renter
// (own payouts) sells only their own line, since the money goes to their
// Stripe account; everyone else can sell the salon's products plus their own.
export function canSellProduct(
  p: { stylistId: string | null },
  stylist: { id: string; independentPayouts: boolean }
) {
  if (p.stylistId === stylist.id) return true;
  return p.stylistId === null && !stylist.independentPayouts;
}
