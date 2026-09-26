import { prisma } from "./prisma";

const SLOT_STEP_MIN = 15;

/**
 * Returns bookable start times (as minutes-from-midnight) for a stylist on
 * a given date, after subtracting existing bookings for that day and the
 * requested service duration.
 *
 * External calendar-sync busy blocks (Google/Outlook) should be merged in
 * here too — same place BookMyPro pulls synced events before returning
 * open slots.
 */
export async function getOpenSlots(stylistId: string, date: Date, durationMin: number) {
  const dayOfWeek = date.getDay();

  const windows = await prisma.availability.findMany({
    where: { stylistId, dayOfWeek },
  });

  if (windows.length === 0) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      stylistId,
      status: "CONFIRMED",
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { startsAt: true, endsAt: true },
  });

  const busy = existingBookings.map((b) => ({
    start: b.startsAt.getHours() * 60 + b.startsAt.getMinutes(),
    end: b.endsAt.getHours() * 60 + b.endsAt.getMinutes(),
  }));

  const openStarts: number[] = [];

  for (const w of windows) {
    for (let start = w.startMin; start + durationMin <= w.endMin; start += SLOT_STEP_MIN) {
      const end = start + durationMin;
      const overlaps = busy.some((b) => start < b.end && end > b.start);
      if (!overlaps) openStarts.push(start);
    }
  }

  return openStarts;
}

export function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}
