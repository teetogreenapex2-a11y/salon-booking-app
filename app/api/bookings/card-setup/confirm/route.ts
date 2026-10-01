import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Upserts the Customer record for whoever's booking and, if the salon has
// connected Stripe, creates a SetupIntent so the frontend can collect a
// card on file before the booking is confirmed. If the salon hasn't
// connected Stripe yet, { skip: true } tells the frontend to proceed
// straight to booking with no card step.
export async function POST(req: NextRequest) {
  const { businessSlug, customer } = await req.json();
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

  if (!business.stripeConnectedAccountId || !business.stripeChargesEnabled) {
    return NextResponse.json({ skip: true, customerId: customerRecord.id });
  }

  let stripeCustomerId = customerRecord.stripeCustomerId;
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create(
      { name: customer.name, email: customer.email, metadata: { customerId: customerRecord.id } },
      { stripeAccount: business.stripeConnectedAccountId }
    );
    stripeCustomerId = stripeCustomer.id;
    await prisma.customer.update({
      where: { id: customerRecord.id },
      data: { stripeCustomerId },
    });
  }

  const setupIntent = await stripe.setupIntents.create(
    { customer: stripeCustomerId, usage: "off_session" },
    { stripeAccount: business.stripeConnectedAccountId }
  );

  return NextResponse.json({
    customerId: customerRecord.id,
    clientSecret: setupIntent.client_secret,
    connectedAccountId: business.stripeConnectedAccountId,
  });
}
