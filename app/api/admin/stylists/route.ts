import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { businessId, name, specialty } = await req.json();
  if (!businessId || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const stylist = await prisma.stylist.create({
    data: { businessId, name, specialty: specialty || null },
  });
  return NextResponse.json(stylist);
}
