import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InstallTip from "@/components/InstallTip";

export default async function ConfirmPage({ searchParams }: { searchParams: { id?: string } }) {
  if (!searchParams.id) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: searchParams.id },
    include: { service: true, stylist: true, business: true },
  });

  if (!booking) notFound();

  return (
    <main className="page">
      <div className="check-circle">✓</div>
      <h1 className="display" style={{ fontSize: 26 }}>You're booked.</h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        A confirmation has been sent to {booking.customerEmail}.
      </p>

      <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>
        <Row label="Service" value={booking.service.name} />
        <Row label="Stylist" value={booking.stylist.name} />
        <Row
          label="When"
          value={booking.startsAt.toLocaleString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        />
        <Row label="Total" value={`$${((booking.priceCents || booking.service.priceCents) / 100).toFixed(0)}`} bold />
      </div>

      <InstallTip businessName={booking.business.name} />
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "5px 0", fontWeight: bold ? 600 : 400 }}>
      <span className="subtle">{label}</span>
      <span>{value}</span>
    </div>
  );
}
