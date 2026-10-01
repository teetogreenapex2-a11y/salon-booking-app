import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe needs the raw request body (not JSON-parsed) to verify the
// signature, which is why this reads req.text() instead of req.json().
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Fires once at the end of Checkout — this is where we learn the new
      // subscription's id and record it against the business.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.businessId;
        if (businessId && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await prisma.business.update({
            where: { id: businessId },
            data: {
              stripeSubscriptionId: sub.id,
              subscriptionStatus: sub.status,
            },
          });
        }
        break;
      }

      // Fires on every status change afterward — trial ending, a renewal,
      // a failed card (past_due), a cancellation. Keeps our copy in sync.
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const businessId = sub.metadata?.businessId;
        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { subscriptionStatus: sub.status },
          });
        } else {
          await prisma.business.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { subscriptionStatus: sub.status },
          });
        }
        break;
      }

      // Fires as a business works through (or updates) Stripe Express
      // onboarding — this is how we know their connected account can
      // actually accept charges yet, so customer card-on-file payments can
      // be enabled.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const businessId = account.metadata?.businessId;
        if (businessId) {
          await prisma.business.update({
            where: { id: businessId },
            data: { stripeChargesEnabled: !!account.charges_enabled },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
