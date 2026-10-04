import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Checks the product belongs to the logged-in owner's business before
// updating — same pattern as every other admin/[id] route in this app.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: { name?: string; priceCents?: number; stockQty?: number; active?: boolean } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.priceCents === "number") data.priceCents = Math.round(body.priceCents);
  if (typeof body.stockQty === "number") data.stockQty = Math.round(body.stockQty);
  if (typeof body.active === "boolean") data.active = body.active;

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(product);
}
