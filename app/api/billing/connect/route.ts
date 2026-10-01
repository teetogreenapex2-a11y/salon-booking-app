import { NextRequest, NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Starts (or resumes) Stripe Express onboarding for the business, so
// customer card-on-file charges (no-show fees, deposits later) land in the
// SALON's own bank account instead of Hairsalonix's. This is separate from
// the business's own $20/mo subscription to Hairsalonix, which stays on
// Hairsalonix's Stripe account.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let accountId = business.stripeConnectedAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { businessId: business.id },
    });
    accountId = account.id;
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeConnectedAccountId: accountId },
    });
  }

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/admin/billing`,
    return_url: `${origin}/admin/billing?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
