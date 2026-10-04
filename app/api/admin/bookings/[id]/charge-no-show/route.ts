import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, businessId: business.id },
    include: { customer: true },
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
  if (!business.stripeConnectedAccountId) {
    return NextResponse.json({ error: "Connect Stripe first in Billing" }, { status: 400 });
  }
  if (!booking.customer?.stripeCustomerId || !booking.customer?.stripePaymentMethodId) {
    return NextResponse.json({ error: "No card on file for this customer" }, { status: 400 });
  }

  try {
    await stripe.paymentIntents.create(
      {
        amount: business.noShowFeeCents,
        currency: "usd",
        customer: booking.customer.stripeCustomerId,
        payment_method: booking.customer.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `No-show fee — ${booking.customerName}`,
      },
      { stripeAccount: business.stripeConnectedAccountId }
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
