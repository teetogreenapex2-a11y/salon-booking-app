import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductActor } from "@/lib/productScope";
import { cleanBarcode } from "@/lib/labels";

// Checks the product belongs to the logged-in owner's business before
// updating — same pattern as every other admin/[id] route in this app.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await getProductActor();
  if (!actor) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const business = actor.business;

  const existing = await prisma.product.findFirst({
    where: { id: params.id, ...actor.scope },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: { barcode?: string | null; name?: string; priceCents?: number; costCents?: number; lowStockAt?: number; stockQty?: number; active?: boolean } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.barcode !== undefined) {
    const code = cleanBarcode(body.barcode);
    if (code) {
      const clash = await prisma.product.findFirst({
        where: { businessId: business.id, barcode: code, NOT: { id: params.id } },
      });
      if (clash) return NextResponse.json({ error: `That barcode is already on "${clash.name}".` }, { status: 409 });
    }
    data.barcode = code;
  }
  if (typeof body.priceCents === "number") data.priceCents = Math.round(body.priceCents);
  if (typeof body.costCents === "number" && body.costCents >= 0) data.costCents = Math.round(body.costCents);
  if (typeof body.lowStockAt === "number" && body.lowStockAt >= 0) data.lowStockAt = Math.round(body.lowStockAt);
  if (typeof body.stockQty === "number") data.stockQty = Math.round(body.stockQty);
  if (typeof body.active === "boolean") data.active = body.active;

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(product);
}
