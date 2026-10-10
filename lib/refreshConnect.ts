import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Asks Stripe directly whether a connected account can take charges yet,
// and saves the answer. Stripe also tells us through a webhook, but that
// only reaches us if it is set up for connected accounts — this makes the
// Billing page correct either way. Returns the up-to-date true/false.
export async function refreshConnectedStatus(
  kind: "business" | "stylist",
  id: string,
  accountId: string | null,
  current: boolean
): Promise<boolean> {
  if (!accountId || current) return current;
  try {
    const account = await stripe.accounts.retrieve(accountId);
    const enabled = !!account.charges_enabled;
    if (enabled) {
      if (kind === "business") {
        await prisma.business.update({ where: { id }, data: { stripeChargesEnabled: true } });
      } else {
        await prisma.stylist.update({ where: { id }, data: { stripeChargesEnabled: true } });
      }
    }
    return enabled;
  } catch (e) {
    console.error("Could not refresh Stripe connect status:", e);
    return current;
  }
}
