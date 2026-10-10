import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { syncBookingToGoogle } from "@/lib/googleCalendar";
import { bookingByToken } from "@/lib/manageBooking";
import { notifyWaitlist } from "@/lib/waitlist";
import { changeStatus, formatWhen } from "@/lib/manage";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const state = changeStatus(booking, booking.business.cancelCutoffHours);
  if (state === "closed") {
    return NextResponse.json({ error: "This appointment can't be changed anymore." }, { status: 400 });
  }
  if (state === "too_late") {
    return NextResponse.json(
      { error: `Cancellations close ${booking.business.cancelCutoffHours} hours before your appointment — please contact ${booking.business.name}.` },
      { status: 400 }
    );
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  await syncBookingToGoogle(booking.id);
  await notifyWaitlist(booking.id);

  const when = formatWhen(booking.startsAt, booking.business.timezone);

  sendEmail(
    booking.customerEmail,
    `Your appointment with ${booking.business.name} was cancelled`,
    `<p>Hi ${booking.customerName},</p>
     <p>Your <strong>${booking.service.name}</strong> appointment on <strong>${when}</strong> has been cancelled. You can book again any time.</p>`
  ).catch((e) => console.error("Cancel email failed", e));

  if (booking.stylist.email) {
    sendEmail(
      booking.stylist.email,
      `${booking.customerName} cancelled`,
      `<p>${booking.customerName} cancelled their ${booking.service.name} on <strong>${when}</strong>. That time is open again.</p>`
    ).catch((e) => console.error("Stylist cancel email failed", e));
  }

  return NextResponse.json({ ok: true });
}
