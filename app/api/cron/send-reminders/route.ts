import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { ensureManageToken, manageUrl } from "@/lib/manage";

export const dynamic = "force-dynamic";

// Runs once a day (see vercel.json). Texts and emails everyone with a
// CONFIRMED booking starting in the next 24–48 hours that hasn't been
// reminded yet, then marks reminderSentAt so it never double-sends.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startsAt: { gte: windowStart, lt: windowEnd },
    },
    include: { business: true, service: true, stylist: true },
  });

  let remindedCount = 0;

  for (const booking of bookings) {
    const link = `https://${process.env.VERCEL_URL}/${booking.business.slug}/booking/${booking.id}`;
    const manageLink = manageUrl(await ensureManageToken(booking.id, booking.manageToken));
    const when = booking.startsAt.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    if (booking.customerPhone && booking.smsConsent) {
      await sendSms(
        booking.customerPhone,
        `Reminder from ${booking.business.name} via Hairsalonix: your ${booking.service.name} appointment is ${when}. Change or cancel: ${manageLink} Reply STOP to cancel, HELP for help.`
      );
    }

    await sendEmail(
      booking.customerEmail,
      `Reminder: your appointment with ${booking.business.name}`,
      `
        <p>Hi ${booking.customerName},</p>
        <p>This is a reminder that your <strong>${booking.service.name}</strong> appointment with
        <strong>${booking.business.name}</strong> is <strong>${when}</strong>.</p>
        <p><a href="${link}">View your appointment details</a></p>
        <p>Can't make it? <a href="${manageLink}">Reschedule or cancel</a>.</p>
      `
    );

    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
    remindedCount++;
  }

  return NextResponse.json({ reminded: remindedCount, totalChecked: bookings.length });
}
