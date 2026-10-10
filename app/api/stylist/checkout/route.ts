import { NextRequest, NextResponse } from "next/server";
import { getCurrentStylist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_BASE } from "@/lib/stripe";

// A booth renter's own $20/mo seat, billed straight to them instead of
// going on the salon's bill — only usable once the owner has turned on
// "Pays Hairsalonix directly for their own seat" for this stylist.
export async function POST(req: NextRequest) {
  const stylist = await getCurrentStylist();
  if (!stylist?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!stylist.independentBilling) {
    return NextResponse.json(
      { error: "Ask the salon owner to turn on independent billing for you first." },
      { status: 400 }
    );
  }

  try {
    let customerId = stylist.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: stylist.email,
        name: stylist.name,
        metadata: { stylistId: stylist.id },
      });
      customerId = customer.id;
      await prisma.stylist.update({
        where: { id: stylist.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_BASE, quantity: 1 }],
      success_url: `${origin}/admin/my-billing?success=1`,
      cancel_url: `${origin}/admin/my-billing?canceled=1`,
      metadata: { stylistId: stylist.id },
      subscription_data: {
        metadata: { stylistId: stylist.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe request failed:", e);
    return NextResponse.json(
      { error: "Stripe said: " + (e?.message || "unknown error") },
      { status: 500 }
    );
  }
}
