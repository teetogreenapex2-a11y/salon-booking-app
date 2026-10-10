import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/placeholderEmail";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// YYYY-MM-DD of an instant, in the salon's timezone.
export function dayInZone(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// Called after a booking is cancelled: emails everyone waiting for that
// stylist on that day (email only), and marks them notified.
export async function notifyWaitlist(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true, stylist: true },
    });
    if (!booking || booking.startsAt < new Date()) return;
    const day = dayInZone(booking.startsAt, booking.business.timezone);
    const waiting = await prisma.waitlistEntry.findMany({
      where: { stylistId: booking.stylistId, day, status: "WAITING" },
      orderBy: { createdAt: "asc" },
    });
    const base = process.env.APP_URL || "https://www.hairsalonix.com";
    const link = `${base}/${booking.business.slug}`;
    const pretty = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
      timeZone: "UTC", weekday: "long", month: "long", day: "numeric",
    });
    for (const w of waiting) {
      await prisma.waitlistEntry.update({ where: { id: w.id }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
      if (isPlaceholderEmail(w.email)) continue;
      sendEmail(
        w.email,
        `A spot opened up at ${booking.business.name}`,
        `<p>Hi ${esc(w.name)},</p>
         <p>Good news — a time just opened up with <strong>${esc(booking.stylist.name)}</strong> on <strong>${pretty}</strong>.</p>
         <p>Spots go to whoever books first: <a href="${link}">book now</a>.</p>`
      ).catch((e) => console.error("Waitlist email failed", e));
    }
  } catch (e) {
    console.error("notifyWaitlist failed", e);
  }
}
