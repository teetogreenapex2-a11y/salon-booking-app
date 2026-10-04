import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

// Rings up retail products at a booking's checkout — credited to whichever
// stylist did the booking (for commission/reporting), charged through
// whichever Stripe account THAT stylist pays out to (their own, for a
// booth renter with independent payouts set up, otherwise the salon's —
// see resolvePayoutAccountId) using the card on file saved under that same
// account.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, businessId: business.id },
    include: { customer: true, stylist: true, sale: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.sale) {
    return NextResponse.json({ error: "Products were already rung up for this booking" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "No card on file for this customer" }, { status: 400 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No products selected" }, { status: 400 });
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: business.id },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const saleItemsData: { productId: string; quantity: number; priceCentsEach: number }[] = [];

  for (const item of items as { productId: string; quantity: number }[]) {
    const product = productById.get(item.productId);
    const quantity = Math.round(Number(item.quantity));
    if (!product || !quantity || quantity < 1) continue;
    if (quantity > product.stockQty) {
      return NextResponse.json(
        { error: `Only ${product.stockQty} of "${product.name}" left in stock` },
        { status: 400 }
      );
    }
    totalCents += product.priceCents * quantity;
    saleItemsData.push({ productId: product.id, quantity, priceCentsEach: product.priceCents });
  }

  if (saleItemsData.length === 0) {
    return NextResponse.json({ error: "No valid products selected" }, { status: 400 });
  }

  const commissionCents = Math.round((totalCents * booking.stylist.retailCommissionPct) / 100);

  let paymentIntentId: string;
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalCents,
        currency: "usd",
        customer: cardRow.stripeCustomerId,
        payment_method: cardRow.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `Product sale — ${booking.customerName}`,
      },
      { stripeAccount: accountId }
    );
    paymentIntentId = paymentIntent.id;
  } catch (err) {
    console.error("[sell-products] card charge failed:", err);
    return NextResponse.json({ error: "The card on file was declined" }, { status: 402 });
  }

  // Charge succeeded — now record the sale and take the stock out. These
  // happen after the charge (not before) so a declined card never leaves
  // stock decremented with no actual sale to show for it.
  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        businessId: business.id,
        bookingId: booking.id,
        stylistId: booking.stylistId,
        customerId: booking.customerId,
        totalCents,
        commissionCents,
        stripePaymentIntentId: paymentIntentId,
        chargedAt: new Date(),
        items: { create: saleItemsData },
      },
      include: { items: true },
    });

    for (const item of saleItemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return NextResponse.json(sale);
}
