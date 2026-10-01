import { NextRequest, NextResponse } from "next/server";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_BASE, STRIPE_PRICE_STYLIST, addOnQuantityFor } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  const user = await getCurrentUser();
  if (!business || !user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let customerId = business.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: business.name,
      metadata: { businessId: business.id },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const activeStylistCount = await prisma.stylist.count({
    where: { businessId: business.id, active: true },
  });
  const addOnQty = addOnQuantityFor(activeStylistCount);

  const lineItems: { price: string; quantity: number }[] = [
    { price: STRIPE_PRICE_BASE, quantity: 1 },
  ];
  if (addOnQty > 0) {
    lineItems.push({ price: STRIPE_PRICE_STYLIST, quantity: addOnQty });
  }

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

  // If they're still inside their free trial, Checkout honors that trial_end
  // instead of charging immediately. Stripe requires trial_end to be at
  // least an hour in the future, so anything closer just skips the trial.
  const trialEnd =
    business.trialEndsAt && business.trialEndsAt.getTime() > Date.now() + 60 * 60 * 1000
      ? Math.floor(business.trialEndsAt.getTime() / 1000)
      : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: `${origin}/admin/billing?success=1`,
    cancel_url: `${origin}/admin/billing?canceled=1`,
    metadata: { businessId: business.id },
    subscription_data: {
      metadata: { businessId: business.id },
      trial_end: trialEnd,
    },
  });

  return NextResponse.json({ url: session.url });
}
