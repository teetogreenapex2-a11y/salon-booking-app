import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const service = await prisma.service.update({ where: { id: params.id }, data });
  return NextResponse.json(service);
}
