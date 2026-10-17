import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Applies a shelf count: sets each product's stock to the counted number.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { counts } = await req.json().catch(() => ({}));
  if (!Array.isArray(counts) || counts.length === 0) {
    return NextResponse.json({ error: "Nothing counted." }, { status: 400 });
  }
  let updated = 0;
  for (const c of counts as { productId: string; qty: number }[]) {
    const qty = Math.round(Number(c.qty));
    if (!c.productId || !(qty >= 0)) continue;
    const r = await prisma.product.updateMany({
      where: { id: c.productId, businessId: business.id },
      data: { stockQty: qty },
    });
    updated += r.count;
  }
  return NextResponse.json({ ok: true, updated });
}
