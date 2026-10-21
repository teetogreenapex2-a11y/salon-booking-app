import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingByToken } from "@/lib/manageBooking";

// The customer taps "Confirm" on their appointment page — the salon sees
// a "confirmed by client" tag on the booking.
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status !== "CONFIRMED" || booking.startsAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This appointment can't be confirmed." }, { status: 400 });
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { clientConfirmedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
