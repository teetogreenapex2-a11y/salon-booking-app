import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const { id, name, tagline, address, instagram, timezone } = await req.json();
  const business = await prisma.business.update({
    where: { id },
    data: { name, tagline, address, instagram, timezone },
  });
  return NextResponse.json(business);
}
