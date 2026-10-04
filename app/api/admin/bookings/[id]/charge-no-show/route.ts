import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, businessId: business.id },
    include: { customer: true, stylist: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "NO_SHOW") {
    return NextResponse.json({ error: "Booking isn't marked as a no-show" }, { status: 400 });
  }
  if (booking.noShowFeeChargedAt) {
    return NextResponse.json({ error: "Already charged" }, { status: 400 });
  }

  // Routes to the stylist's OWN connected account if they're a booth
  // renter with independent payouts set up, otherwise the salon's — see
  // resolvePayoutAccountId. The card that gets charged has to be the one
  // saved under that SAME account (a card from one connected account can't
  // be charged from another), which is why this looks up CustomerCard
  // instead of a single card on the Customer row.
  const accountId = resolvePayoutAccountId(booking.stylist, business);
  if (!accountId) {
    return NextResponse.json({ error: "Connect Stripe first in Billing" }, { status: 400 });
  }
  if (!booking.customerId) {
    return NextResponse.json({ error: "No card on file for this customer" }, { status: 400 });
  }
  const cardRow = await prisma.customerCard.findUnique({
    where: { customerId_connectedAccountId: { customerId: booking.customerId, connectedAccountId: accountId } },
  });
  if (!cardRow?.stripePaymentMethodId) {
    const whose = accountId === booking.stylist.stripeConnectedAccountId ? booking.stylist.name : "the salon";
    return NextResponse.json(
      { error: `No card on file for ${whose}'s account — the customer would need to book (and save a card) again now that this stylist's payouts are routed separately.` },
      { status: 400 }
    );
  }

  try {
    await stripe.paymentIntents.create(
      {
        amount: business.noShowFeeCents,
        currency: "usd",
        customer: cardRow.stripeCustomerId,
        payment_method: cardRow.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `No-show fee — ${booking.customerName}`,
      },
      { stripeAccount: accountId }
    );
  } catch (err) {
    console.error("[charge-no-show] card charge failed:", err);
    return NextResponse.json({ error: "The card on file was declined" }, { status: 402 });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { noShowFeeChargedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
