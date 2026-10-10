import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { dollarsToCents } from "@/lib/giftCards";

export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 80);
  const price = dollarsToCents(b.price);
  const pct = Math.round(Number(b.discountPct));
  if (!name || !(price >= 0) || !(pct >= 0 && pct <= 100)) {
    return NextResponse.json({ error: "Enter a name, a monthly price and a discount between 0 and 100%." }, { status: 400 });
  }
  await prisma.membershipPlan.create({ data: { businessId: business.id, name, priceCents: price, discountPct: pct } });
  return NextResponse.json({ ok: true });
}
