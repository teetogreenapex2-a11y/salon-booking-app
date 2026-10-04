import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Called right after the browser successfully saves a card via Stripe
// Elements. Looks up which payment method the SetupIntent actually saved,
// makes it the customer's default on Stripe, and records it on the
// CustomerCard row for that connected account so a later charge route can
// use it.
export async function POST(req: NextRequest) {
  const { customerId, setupIntentId, connectedAccountId } = await req.json();
  if (!customerId || !setupIntentId || !connectedAccountId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
    stripeAccount: connectedAccountId,
  });

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    return NextResponse.json({ error: "No payment method on setup intent" }, { status: 400 });
  }

  const cardRow = await prisma.customerCard.findUnique({
    where: { customerId_connectedAccountId: { customerId, connectedAccountId } },
  });
  if (!cardRow) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await stripe.customers.update(
    cardRow.stripeCustomerId,
    { invoice_settings: { default_payment_method: paymentMethodId } },
    { stripeAccount: connectedAccountId }
  );

  await prisma.customerCard.update({
    where: { customerId_connectedAccountId: { customerId, connectedAccountId } },
    data: { stripePaymentMethodId: paymentMethodId },
  });

  return NextResponse.json({ ok: true });
}
