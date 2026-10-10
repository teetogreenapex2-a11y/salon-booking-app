import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// renew = record a month's payment; cancel = end the membership.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { action } = await req.json().catch(() => ({}));
  const m = await prisma.membership.findFirst({ where: { id: params.id, businessId: business.id } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "cancel") {
    await prisma.membership.update({ where: { id: m.id }, data: { status: "CANCELLED" } });
  } else if (action === "renew") {
    // Extend from the later of today and the current paid-through date, so
    // paying early doesn't lose time and paying late doesn't backdate.
    const from = m.paidThrough > new Date() ? m.paidThrough : new Date();
    const next = new Date(from);
    next.setMonth(next.getMonth() + 1);
    await prisma.membership.update({ where: { id: m.id }, data: { paidThrough: next, status: "ACTIVE" } });
  } else {
    return NextResponse.json({ error: "Bad action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
