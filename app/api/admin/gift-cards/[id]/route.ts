import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Void or restore a card.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { voided } = await req.json().catch(() => ({}));
  await prisma.giftCard.updateMany({
    where: { id: params.id, businessId: business.id },
    data: { voided: !!voided },
  });
  return NextResponse.json({ ok: true });
}
