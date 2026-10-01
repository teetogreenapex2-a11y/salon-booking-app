import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const STRIPE_PRICE_BASE = process.env.STRIPE_PRICE_BASE!;
export const STRIPE_PRICE_STYLIST = process.env.STRIPE_PRICE_STYLIST!;

// $20 base covers the first stylist — everyone after that is $10/mo more.
// Independent accounts always have exactly one stylist (themselves), so
// this naturally comes out to $20 flat for them with no branching needed.
export function addOnQuantityFor(activeStylistCount: number) {
  return Math.max(activeStylistCount - 1, 0);
}

// Keeps a business's Stripe subscription quantity in sync with its actual
// active stylist count. Call this any time a stylist is added, deactivated,
// reactivated, or deleted. Safe no-op if the business hasn't subscribed yet.
export async function syncStylistSubscriptionQuantity(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.stripeSubscriptionId) return;

  const activeStylistCount = await prisma.stylist.count({
    where: { businessId, active: true },
  });
  const quantity = addOnQuantityFor(activeStylistCount);

  const subscription = await stripe.subscriptions.retrieve(business.stripeSubscriptionId);
  const addOnItem = subscription.items.data.find((i) => i.price.id === STRIPE_PRICE_STYLIST);

  if (quantity === 0) {
    // Stripe won't allow a quantity of 0 on a line item — remove it
    // entirely instead of trying to set it to zero.
    if (addOnItem) {
      await stripe.subscriptionItems.del(addOnItem.id);
    }
    return;
  }

  if (addOnItem) {
    await stripe.subscriptionItems.update(addOnItem.id, { quantity });
  } else {
    await stripe.subscriptionItems.create({
      subscription: business.stripeSubscriptionId,
      price: STRIPE_PRICE_STYLIST,
      quantity,
    });
  }
}
