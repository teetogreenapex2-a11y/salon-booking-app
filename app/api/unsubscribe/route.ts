import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unsubSig } from "@/lib/marketing";

export async function POST(req: NextRequest) {
  const { customerId, sig } = await req.json().catch(() => ({}));
  if (!customerId || !sig || sig !== unsubSig(String(customerId))) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  await prisma.customer.updateMany({ where: { id: String(customerId) }, data: { marketingOptOut: true } });
  return NextResponse.json({ ok: true });
}
