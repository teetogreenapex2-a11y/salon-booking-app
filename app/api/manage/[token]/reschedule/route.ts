import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenSlots } from "@/lib/availability";
import { getEffectiveServiceInfo } from "@/lib/pricing";
import { sendEmail } from "@/lib/email";
import { syncBookingToGoogle } from "@/lib/googleCalendar";
import { bookingByToken } from "@/lib/manageBooking";
import { changeStatus, formatWhen, manageUrl } from "@/lib/manage";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const state = changeStatus(booking, booking.business.cancelCutoffHours);
  if (state === "closed") {
    return NextResponse.json({ error: "This appointment can't be changed anymore." }, { status: 400 });
  }
  if (state === "too_late") {
    return NextResponse.json(
      { error: `Changes close ${booking.business.cancelCutoffHours} hours before your appointment — please contact ${booking.business.name}.` },
      { status: 400 }
    );
  }

  const { startsAt } = await req.json().catch(() => ({}));
  const start = new Date(startsAt);
  if (!startsAt || isNaN(start.getTime()) || start.getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a time in the future." }, { status: 400 });
  }

  const info = await getEffectiveServiceInfo(booking.stylistId, booking.serviceId);
  const durationMin = info?.durationMin ?? Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000);
  const end = new Date(start.getTime() + durationMin * 60000);

  // The requested start must be one of the stylist's genuinely open times.
  const open = await getOpenSlots(booking.stylistId, start, durationMin, booking.id);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const conflict = await prisma.booking.findFirst({
    where: {
      stylistId: booking.stylistId,
      status: "CONFIRMED",
      id: { not: booking.id },
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
  });
  if (!open.includes(startMin) || conflict) {
    return NextResponse.json({ error: "That time was just taken — please pick another." }, { status: 409 });
  }

  const oldWhen = formatWhen(booking.startsAt, booking.business.timezone);
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { startsAt: start, endsAt: end, reminderSentAt: null },
  });
  await syncBookingToGoogle(updated.id);

  const when = formatWhen(start, booking.business.timezone);
  const link = manageUrl(params.token, req.headers.get("origin") || undefined);

  sendEmail(
    booking.customerEmail,
    `Your appointment with ${booking.business.name} was rescheduled`,
    `<p>Hi ${booking.customerName},</p>
     <p>Your <strong>${booking.service.name}</strong> appointment with <strong>${booking.business.name}</strong> is now <strong>${when}</strong>.</p>
     <p><a href="${link}">Reschedule or cancel</a></p>`
  ).catch((e) => console.error("Reschedule email failed", e));

  if (booking.stylist.email) {
    sendEmail(
      booking.stylist.email,
      `${booking.customerName} rescheduled`,
      `<p>${booking.customerName} moved their ${booking.service.name} from ${oldWhen} to <strong>${when}</strong>.</p>`
    ).catch((e) => console.error("Stylist reschedule email failed", e));
  }

  return NextResponse.json({ ok: true, startsAt: updated.startsAt });
}
