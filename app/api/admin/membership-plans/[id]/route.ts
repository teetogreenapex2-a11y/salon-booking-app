import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Retire (or bring back) a plan. Existing members keep their discount.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { active } = await req.json().catch(() => ({}));
  await prisma.membershipPlan.updateMany({ where: { id: params.id, businessId: business.id }, data: { active: !!active } });
  return NextResponse.json({ ok: true });
}
