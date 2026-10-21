import { partsInTz } from "@/lib/tz";
import { NextRequest, NextResponse } from "next/server";
import { getOpenSlots } from "@/lib/availability";
import { getEffectiveServiceInfo } from "@/lib/pricing";
import { bookingByToken } from "@/lib/manageBooking";

export const dynamic = "force-dynamic";

// Open times for the customer's own stylist and service, ignoring the
// booking they're moving so its current time can be picked again.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dateParam = new URL(req.url).searchParams.get("date");
  if (!dateParam || isNaN(new Date(dateParam).getTime())) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const info = await getEffectiveServiceInfo(booking.stylistId, booking.serviceId);
  const durationMin = info?.durationMin ?? Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000);
  const slots = await getOpenSlots(booking.stylistId, new Date(dateParam), durationMin, booking.id);

  // Never offer times that have already passed today.
  const date = new Date(dateParam);
  const now = new Date();
  const tz = booking.business.timezone;
  const dp = partsInTz(date, tz);
  const np = partsInTz(now, tz);
  const sameDay = dp.year === np.year && dp.month === np.month && dp.day === np.day;
  const nowMin = np.minutesOfDay;
  return NextResponse.json({ slots: sameDay ? slots.filter((m) => m > nowMin) : slots });
}
