import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

function addMonth(d: Date) {
  const n = new Date(d);
  n.setMonth(n.getMonth() + 1);
  return n;
}

// Sign a customer up to a plan, paid through one month from today.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { customerId, planId } = await req.json().catch(() => ({}));
  const [customer, plan] = await Promise.all([
    prisma.customer.findFirst({ where: { id: String(customerId || ""), businessId: business.id } }),
    prisma.membershipPlan.findFirst({ where: { id: String(planId || ""), businessId: business.id, active: true } }),
  ]);
  if (!customer || !plan) return NextResponse.json({ error: "Pick a customer and a plan." }, { status: 400 });

  const paidThrough = addMonth(new Date());
  await prisma.membership.upsert({
    where: { customerId: customer.id },
    update: { planId: plan.id, paidThrough, status: "ACTIVE" },
    create: { businessId: business.id, customerId: customer.id, planId: plan.id, paidThrough },
  });
  return NextResponse.json({ ok: true });
}
