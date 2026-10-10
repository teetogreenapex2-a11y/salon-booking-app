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
    // Give any gift card money used on this booking back to its cards.
    if (booking.giftCardCents > 0) {
      const uses = await prisma.giftCardUse.findMany({ where: { bookingId: booking.id } });
      for (const u of uses) {
        await prisma.giftCard.update({ where: { id: u.giftCardId }, data: { balanceCents: { increment: u.amountCents } } });
      }
      await prisma.giftCardUse.deleteMany({ where: { bookingId: booking.id } });
    }
    const cleared = await prisma.booking.update({
      where: { id: booking.id },
      data: { paidOutsideAt: null, paidOutsideMethod: null, giftCardCents: 0 },
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
