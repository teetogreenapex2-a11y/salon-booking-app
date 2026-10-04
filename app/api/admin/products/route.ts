import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// businessId always comes from the logged-in user's own business, never
// from the request body — same reasoning as /api/admin/stylists.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { name, priceCents, stockQty } = await req.json();
  if (!name || typeof priceCents !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      name,
      priceCents: Math.round(priceCents),
      stockQty: typeof stockQty === "number" ? Math.round(stockQty) : 0,
    },
  });

  return NextResponse.json(product);
}
