import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      notes: data.notes,
      allergies: data.allergies,
      preferredStylistId: data.preferredStylistId,
    },
  });
  return NextResponse.json(customer);
}
