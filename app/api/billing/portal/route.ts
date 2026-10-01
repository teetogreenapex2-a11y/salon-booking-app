import { NextRequest, NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${origin}/admin/billing`,
  });

  return NextResponse.json({ url: session.url });
}
