import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import { normalizeCode } from "@/lib/giftCards";

// Applies a gift card to a booking's bill: takes as much of the balance as
// is still owed. If that covers everything, the booking is marked paid.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  const stylist = business ? null : await getCurrentStylist();
  if (!business && !stylist) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const booking = await prisma.booking.findFirst({
    where: business ? { id: params.id, businessId: business.id } : { id: params.id, stylistId: stylist!.id },
    include: { sale: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { code } = await req.json().catch(() => ({}));
  const card = await prisma.giftCard.findUnique({ where: { code: normalizeCode(code) } });
  if (!card || card.businessId !== booking.businessId || card.voided) {
    return NextResponse.json({ error: "That gift card code wasn't found." }, { status: 404 });
  }
  if (card.balanceCents <= 0) {
    return NextResponse.json({ error: "That gift card has no balance left." }, { status: 400 });
  }

  const due = booking.priceCents + (booking.sale?.totalCents ?? 0) - booking.giftCardCents;
  if (due <= 0) return NextResponse.json({ error: "Nothing left to pay on this booking." }, { status: 400 });
  const amount = Math.min(card.balanceCents, due);

  try {
    await prisma.$transaction(async (tx: any) => {
      const r = await tx.giftCard.updateMany({
        where: { id: card.id, balanceCents: { gte: amount }, voided: false },
        data: { balanceCents: { decrement: amount } },
      });
      if (r.count !== 1) throw new Error("balance changed");
      await tx.giftCardUse.create({ data: { giftCardId: card.id, bookingId: booking.id, amountCents: amount } });
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          giftCardCents: { increment: amount },
          ...(amount === due ? { paidOutsideAt: new Date(), paidOutsideMethod: "Gift card" } : {}),
        },
      });
    });
  } catch {
    return NextResponse.json({ error: "Couldn't apply it — try again." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, applied: amount, remaining: due - amount, cardBalance: card.balanceCents - amount });
}
