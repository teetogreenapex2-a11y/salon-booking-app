import { NextResponse } from "next/server";
import { getCurrentOwnerContext } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { deleteBusinessCompletely } from "@/lib/deleteBusiness";

// Lets the account owner delete their own salon and login (App Store rule).
export async function DELETE() {
  const ctx = await getCurrentOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!ctx.isPrimary) {
    return NextResponse.json({ error: "Only the account owner can delete the account." }, { status: 403 });
  }

  // Stop billing first so a deleted account is never charged again.
  const subId = ctx.business.stripeSubscriptionId;
  if (subId) {
    try {
      await stripe.subscriptions.cancel(subId);
    } catch (e) {
      console.error("[account delete] could not cancel Stripe subscription", e);
    }
  }

  try {
    const result = await deleteBusinessCompletely(ctx.business.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account delete] failed", e);
    return NextResponse.json({ error: "Couldn't delete the account. Please contact support." }, { status: 500 });
  }
}
