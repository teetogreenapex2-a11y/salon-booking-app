import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

// Charges the customer's saved card for what's left on the bill (price,
// minus any gift card and deposit already paid) plus an optional tip. The
// money goes to the same connected Stripe account as the deposit and the
// no-show fee. An owner can charge any booking; a stylist only their own.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ownerBusiness = await getCurrentBusiness();
  const me = ownerBusiness ? null : await getCurrentStylist();
  if (!ownerBusiness && !me) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: ownerBusiness
      ? { id: params.id, businessId: ownerBusiness.id }
      : { id: params.id, stylistId: me!.id },
    include: { stylist: true, business: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.paidOutsideAt) return NextResponse.json({ error: "Already marked paid" }, { status: 400 });
  if (booking.status === "CANCELLED" || booking.status === "NO_SHOW") {
    return NextResponse.json({ error: "This booking can't be charged" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const tipCents = Math.max(0, Math.min(Math.round(Number(body.tipCents) || 0), 100000));

  const depositPaid = booking.depositRefundedAt ? 0 : booking.depositCents;
  const dueCents = Math.max(0, booking.priceCents - booking.giftCardCents - depositPaid);
  const amount = dueCents + tipCents;
  if (amount < 50) {
    return NextResponse.json({ error: "Nothing to charge — mark it paid instead." }, { status: 400 });
  }

  const accountId = resolvePayoutAccountId(booking.stylist, booking.business);
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
    return NextResponse.json({ error: "No card on file for this customer" }, { status: 400 });
  }

  let intentId: string;
  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        customer: cardRow.stripeCustomerId,
        payment_method: cardRow.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `${booking.customerName} — balance${tipCents ? " + tip" : ""}`,
        metadata: { kind: "balance", bookingId: booking.id, tipCents: String(tipCents) },
      },
      // Same booking + amount can't be charged twice if the button is double-tapped.
      { stripeAccount: accountId, idempotencyKey: `balance-${booking.id}-${amount}` }
    );
    intentId = pi.id;
  } catch (err) {
    console.error("[charge-card] card charge failed:", err);
    return NextResponse.json({ error: "The card on file was declined" }, { status: 402 });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paidOutsideAt: new Date(), paidOutsideMethod: "Card", tipCents, stripePaymentIntentId: intentId },
  });
  return NextResponse.json({ ok: true, charged: amount });
}
