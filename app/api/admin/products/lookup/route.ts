import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Finds one of this business's products by scanned barcode.
export async function GET(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  const product = await prisma.product.findFirst({ where: { businessId: business.id, barcode: code } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
