import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bookingByToken } from "@/lib/manageBooking";
import { changeStatus, formatWhen } from "@/lib/manage";
import ManageBooking from "@/components/ManageBooking";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your appointment", robots: { index: false, follow: false } };

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
      {booking.business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={booking.business.logoUrl}
          alt=""
          style={{ display: "block", margin: "0 auto 10px", maxHeight: 64, maxWidth: 160, objectFit: "contain" }}
        />
      ) : null}
      <h1 className="display title" style={{ fontSize: 26, textAlign: "center" }}>
        {booking.business.name}
      </h1>

      <ManageBooking
        token={params.token}
        businessName={booking.business.name}
        businessSlug={booking.business.slug}
        businessAddress={booking.business.address}
        businessPhone={booking.business.phone}
        firstName={(booking.customerName || "").trim().split(/\s+/)[0] || ""}
        serviceName={booking.service.name}
        stylistName={booking.stylist.name}
        whenLabel={when}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        status={booking.status}
        state={state}
        cutoffHours={booking.business.cancelCutoffHours}
        previous={previous}
        future={future}
      />
    </main>
  );
}
