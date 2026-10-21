import { bookingByToken } from "@/lib/manageBooking";

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(t: string) {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// "Add to calendar" — a one-event .ics file the customer's phone opens.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const b = await bookingByToken(params.token);
  if (!b) return new Response("Not found", { status: 404 });
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hairsalonix//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@hairsalonix.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(b.startsAt)}`,
    `DTEND:${stamp(b.endsAt)}`,
    `SUMMARY:${esc(`${b.service.name} at ${b.business.name}`)}`,
    ...(b.business.address ? [`LOCATION:${esc(b.business.address)}`] : []),
    `DESCRIPTION:${esc(`With ${b.stylist.name}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="appointment.ics"',
    },
  });
}
