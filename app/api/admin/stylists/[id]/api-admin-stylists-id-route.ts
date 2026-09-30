import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Checks the stylist belongs to the logged-in user's business before
// updating — otherwise anyone signed in could edit any stylist in the
// database just by knowing (or guessing) its id.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.stylist.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await req.json();
  const stylist = await prisma.stylist.update({ where: { id: params.id }, data });
  return NextResponse.json(stylist);
}
