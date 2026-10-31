import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductActor } from "@/lib/productScope";
import { cleanBarcode } from "@/lib/labels";

// businessId always comes from the logged-in user's own business, never
// from the request body — same reasoning as /api/admin/stylists.
export async function POST(req: NextRequest) {
  const actor = await getProductActor();
  if (!actor) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const business = actor.business;

  const { name, priceCents, stockQty, costCents, lowStockAt, barcode } = await req.json();
  if (!name || typeof priceCents !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const code = cleanBarcode(barcode);
  if (code) {
    const clash = await prisma.product.findFirst({ where: { businessId: business.id, barcode: code } });
    if (clash) return NextResponse.json({ error: `That barcode is already on "${clash.name}".` }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      stylistId: actor.stylistId,
      name,
      barcode: code,
      priceCents: Math.round(priceCents),
      stockQty: typeof stockQty === "number" ? Math.round(stockQty) : 0,
      costCents: typeof costCents === "number" && costCents >= 0 ? Math.round(costCents) : 0,
      lowStockAt: typeof lowStockAt === "number" && lowStockAt >= 0 ? Math.round(lowStockAt) : 3,
    },
  });

  return NextResponse.json(product);
}
