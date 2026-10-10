import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await prisma.waitlistEntry.deleteMany({ where: { id: params.id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
