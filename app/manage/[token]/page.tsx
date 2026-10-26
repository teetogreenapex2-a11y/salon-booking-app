import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bookingByToken } from "@/lib/manageBooking";
import { changeStatus, formatWhen } from "@/lib/manage";
import SalonHeader from "@/components/SalonHeader";
import ManageBooking from "@/components/ManageBooking";

export const dynamic = "force-dynamic";

// What shows in the text-message link preview card: the salon's name, the
// appointment time, and the salon's own picture (cover, then logo, then ours).
export async function generateMetadata({ params }: { params: { token: string } }) {
  const base = (process.env.APP_URL || "https://www.hairsalonix.com").replace(/\/$/, "");
  const booking = await bookingByToken(params.token);
  if (!booking) return { title: "Your appointment", robots: { index: false, follow: false } };
  const b = booking.business;
  const when = formatWhen(booking.startsAt, b.timezone);
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);
  const image = abs(b.coverUrl || b.logoUrl || "/icon-512.png");
  const title = `Your appointment at ${b.name}`;
  const description = `${booking.service.name} with ${booking.stylist.name} · ${when}. Tap to see details, reschedule or add to calendar.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, siteName: b.name, type: "website", images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ManagePage({ params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) notFound();

  const state = changeStatus(booking, booking.business.cancelCutoffHours);
  const tz = booking.business.timezone;
  const when = formatWhen(booking.startsAt, tz);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => {
    try {
      return d.toLocaleString("en-US", { ...o, timeZone: tz });
    } catch {
      return d.toLocaleString("en-US", o);
    }
  };
  const dateLabel = fmt(booking.startsAt, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeLabel = fmt(booking.startsAt, { hour: "numeric", minute: "2-digit" });

  // Their other visits at this salon (matched on the same email), for the
  // Previous / Future tabs.
  const others = await prisma.booking.findMany({
    where: {
      businessId: booking.businessId,
      customerEmail: { equals: booking.customerEmail, mode: "insensitive" },
      id: { not: booking.id },
    },
    include: { service: true },
    orderBy: { startsAt: "desc" },
    take: 40,
  });
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const googleCalUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${booking.service.name} at ${booking.business.name}`)}` +
    `&dates=${stamp(booking.startsAt)}/${stamp(booking.endsAt)}` +
    `&details=${encodeURIComponent(`With ${booking.stylist.name}`)}` +
    (booking.business.address ? `&location=${encodeURIComponent(booking.business.address)}` : "");
  const now = Date.now();
  const toRow = (b: (typeof others)[number]) => ({
    id: b.id,
    service: b.service.name,
    when: formatWhen(b.startsAt, tz),
    status: b.status,
  });
  const previous = others.filter((b) => b.startsAt.getTime() < now).map(toRow);
  const future = others.filter((b) => b.startsAt.getTime() >= now && b.status === "CONFIRMED").map(toRow).reverse();

  return (
    <main className="page">
      <SalonHeader name={booking.business.name} coverUrl={booking.business.coverUrl} compact />

      <ManageBooking
        token={params.token}
        businessName={booking.business.name}
        businessSlug={booking.business.slug}
        businessAddress={booking.business.address}
        businessPhone={booking.business.phone}
        firstName={(booking.customerName || "").trim().split(/\s+/)[0] || ""}
        serviceName={booking.service.name}
        depositLabel={
          booking.depositCents > 0
            ? booking.depositRefundedAt
              ? `$${(booking.depositCents / 100).toFixed(2)} refunded`
              : `$${(booking.depositCents / 100).toFixed(2)} paid`
            : null
        }
        stylistName={booking.stylist.name}
        whenLabel={when}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        status={booking.status}
        state={state}
        cutoffHours={booking.business.cancelCutoffHours}
        confirmed={!!booking.clientConfirmedAt}
        googleCalUrl={googleCalUrl}
        previous={previous}
        future={future}
      />
    </main>
  );
}
