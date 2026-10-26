import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

// Upserts the Customer record for whoever's booking and, if a connected
// Stripe account is ready to accept charges, creates a SetupIntent so the
// frontend can collect a card on file before the booking is confirmed. If
// nothing's connected yet, { skip: true } tells the frontend to proceed
// straight to booking with no card step.
//
// Which Stripe account the card is saved under depends on which stylist
// was picked (stylistId) — their own connected account if they're a booth
// renter with independent payouts set up, otherwise the salon's. A card
// is only ever usable for charges made under the SAME connected account it
// was saved in, so this matters: see CustomerCard's comment in schema.prisma.
export async function POST(req: NextRequest) {
  const { businessSlug, customer, stylistId, serviceId } = await req.json();
  if (!businessSlug || !customer?.name || !customer?.email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerRecord = await prisma.customer.upsert({
    where: { businessId_email: { businessId: business.id, email: customer.email } },
    update: { name: customer.name, phone: customer.phone || undefined },
    create: {
      businessId: business.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || null,
    },
  });

  // Falls back to the salon's own account if no stylist was passed, or
  // that stylist isn't a real booth renter — same as before this existed.
  const stylist = stylistId
    ? await prisma.stylist.findFirst({ where: { id: stylistId, businessId: business.id } })
    : null;
  const accountId = stylist ? resolvePayoutAccountId(stylist, business) : business.stripeConnectedAccountId;
  const chargesEnabled = stylist
    ? accountId === stylist.stripeConnectedAccountId
      ? stylist.stripeChargesEnabled
      : business.stripeChargesEnabled
    : business.stripeChargesEnabled;

  if (!accountId || !chargesEnabled) {
    return NextResponse.json({ skip: true, customerId: customerRecord.id });
  }

  let cardRow = await prisma.customerCard.findUnique({
    where: { customerId_connectedAccountId: { customerId: customerRecord.id, connectedAccountId: accountId } },
  });

  let stripeCustomerId = cardRow?.stripeCustomerId;
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create(
      { name: customer.name, email: customer.email, metadata: { customerId: customerRecord.id } },
      { stripeAccount: accountId }
    );
    stripeCustomerId = stripeCustomer.id;
    cardRow = await prisma.customerCard.upsert({
      where: { customerId_connectedAccountId: { customerId: customerRecord.id, connectedAccountId: accountId } },
      update: { stripeCustomerId },
      create: { customerId: customerRecord.id, connectedAccountId: accountId, stripeCustomerId },
    });
  }

  // Deposit comes from the SERVICE row on the server, never from the browser.
  const service = serviceId
    ? await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id } })
    : null;
  const depositCents =
    business.depositsEnabled && (stylist?.depositsEnabled ?? true) ? (service?.depositCents ?? 0) : 0;

  if (depositCents > 0) {
    // Charge the deposit now and keep the card for later (no-show fee).
    const pi = await stripe.paymentIntents.create(
      {
        amount: depositCents,
        currency: "usd",
        customer: stripeCustomerId,
        setup_future_usage: "off_session",
        payment_method_types: ["card"],
        description: `Deposit — ${service!.name} — ${customer.name}`,
        metadata: { kind: "deposit", serviceId: service!.id, customerId: customerRecord.id },
      },
      { stripeAccount: accountId }
    );
    return NextResponse.json({
      customerId: customerRecord.id,
      clientSecret: pi.client_secret,
      connectedAccountId: accountId,
      depositCents,
      mode: "payment",
    });
  }

  const setupIntent = await stripe.setupIntents.create(
    { customer: stripeCustomerId, usage: "off_session" },
    { stripeAccount: accountId }
  );

  return NextResponse.json({
    customerId: customerRecord.id,
    clientSecret: setupIntent.client_secret,
    connectedAccountId: accountId,
    depositCents: 0,
    mode: "setup",
  });
}
