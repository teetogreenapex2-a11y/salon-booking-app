import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

const METHODS = ["Venmo", "Cash App", "Zelle", "Cash", "Other"];

// Records that a customer paid outside the app. Nothing is charged — this
// only stamps the booking so the owner can see it was settled.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // An owner can mark any booking in their business; a signed-in stylist
  // only their own.
  const business = await getCurrentBusiness();
  const stylist = business ? null : await getCurrentStylist();
  if (!business && !stylist) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: business
      ? { id: params.id, businessId: business.id }
      : { id: params.id, stylistId: stylist!.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  // { undo: true } clears the record, for a tap on the wrong button.
  if (body.undo) {
    const cleared = await prisma.booking.update({
      where: { id: booking.id },
      data: { paidOutsideAt: null, paidOutsideMethod: null },
    });
    return NextResponse.json(cleared);
  }

  if (!METHODS.includes(body.method)) {
    return NextResponse.json({ error: "Pick how they paid." }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { paidOutsideAt: new Date(), paidOutsideMethod: body.method },
  });
  return NextResponse.json(updated);
}
