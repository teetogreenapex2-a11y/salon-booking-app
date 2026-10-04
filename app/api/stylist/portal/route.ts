import { NextRequest, NextResponse } from "next/server";
import { getCurrentStylist } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stylist = await getCurrentStylist();
  if (!stylist?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

  const session = await stripe.billingPortal.sessions.create({
    customer: stylist.stripeCustomerId,
    return_url: `${origin}/admin/my-billing`,
  });

  return NextResponse.json({ url: session.url });
}
