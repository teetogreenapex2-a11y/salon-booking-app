import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { notifyWaitlist } from "@/lib/waitlist";
import { syncBookingToGoogle } from "@/lib/googleCalendar";

// Confirms the booking belongs to the logged-in user's business before
// changing its status — otherwise anyone signed in could cancel or mark
// no-show on any booking in the database just by knowing its id.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.booking.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status } = await req.json();
  const booking = await prisma.booking.update({
    where: { id: params.id },
    data: { status },
  });
  await syncBookingToGoogle(booking.id);
  if (status === "CANCELLED") await notifyWaitlist(booking.id);
  return NextResponse.json(booking);
}
