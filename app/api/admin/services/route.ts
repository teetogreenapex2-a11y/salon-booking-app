import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { businessId, name, durationMin, priceCents } = await req.json();
  if (!businessId || !name || !durationMin || !priceCents) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: { businessId, name, durationMin, priceCents },
  });
  return NextResponse.json(service);
}
