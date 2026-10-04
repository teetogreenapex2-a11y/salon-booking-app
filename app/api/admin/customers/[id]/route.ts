import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Checks the customer belongs to the logged-in user's business before
// updating — otherwise anyone signed in could edit any customer in the
// database just by knowing (or guessing) its id.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { notes, allergies, preferredStylistId } = await req.json();

  // A preferred stylist has to actually belong to this business too —
  // otherwise someone could point a customer at another business's
  // stylist id.
  if (preferredStylistId) {
    const stylist = await prisma.stylist.findFirst({
      where: { id: preferredStylistId, businessId: business.id },
    });
    if (!stylist) {
      return NextResponse.json({ error: "Invalid stylist" }, { status: 400 });
    }
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: { notes, allergies, preferredStylistId },
  });

  return NextResponse.json(updated);
}
