import { NextRequest, NextResponse } from "next/server";
import { getCurrentStylist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Same idea as /api/billing/connect, but for a single booth-renting
// stylist instead of the whole business — only usable once the owner has
// turned on "Keeps their own card-charge payouts" for this stylist on the
// Stylists page.
export async function POST(req: NextRequest) {
  const stylist = await getCurrentStylist();
  if (!stylist) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!stylist.independentPayouts) {
    return NextResponse.json(
      { error: "Ask the salon owner to turn on independent payouts for you first." },
      { status: 400 }
    );
  }

  let accountId = stylist.stripeConnectedAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { stylistId: stylist.id },
    });
    accountId = account.id;
    await prisma.stylist.update({
      where: { id: stylist.id },
      data: { stripeConnectedAccountId: accountId },
    });
  }

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/admin/my-billing`,
    return_url: `${origin}/admin/my-billing?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
