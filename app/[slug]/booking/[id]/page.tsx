import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Scissors } from "lucide-react";
import { venmoUrl, cashAppUrl, hasAnyHandle } from "@/lib/paymentHandles";
import { ensureManageToken } from "@/lib/manage";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export default async function BookingDetailsPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const booking = await prisma.booking.findFirst({
    where: { id: params.id, business: { slug: params.slug } },
    include: { business: true, service: true, stylist: true },
  });

  if (!booking) notFound();

  // Optional pay-outside-the-app card — only shown while the booking is
  // still live, hasn't been marked paid, and the stylist set something up.
  const stylist = booking.stylist;
  const showPay =
    (booking.status === "CONFIRMED" || booking.status === "COMPLETED") &&
    !booking.paidOutsideAt &&
    hasAnyHandle(stylist);
  const canManage = booking.status === "CONFIRMED" && booking.startsAt.getTime() > Date.now();
  const manageToken = canManage ? await ensureManageToken(booking.id, booking.manageToken) : null;
  const payNote = `${booking.service.name} with ${stylist.name}`;

  return (
    <main className="page">
      <div className="hero">
        <Scissors size={32} color="var(--berry)" />
      </div>

      <h1 className="display title" style={{ fontSize: 24 }}>
        {booking.business.name}
      </h1>
      <p className="tagline" style={{ marginBottom: 24 }}>
        Here are your appointment details.
      </p>

      <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>
        <Row label="Status" value={STATUS_LABEL[booking.status] ?? booking.status} />
        <Row
          label="Date"
          value={booking.startsAt.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        />
        <Row
          label="Time"
          value={booking.startsAt.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        />
        <Row label="Service" value={booking.service.name} />
        <Row label="Stylist" value={booking.stylist.name} />
        {booking.business.address && <Row label="Location" value={booking.business.address} />}
      </div>

      {manageToken && (
        <a className="btn-ghost" style={{ display: "block", textAlign: "center", marginTop: 18 }} href={`/manage/${manageToken}`}>
          Reschedule or cancel
        </a>
      )}

      {booking.paidOutsideAt && (
        <p className="subtle" style={{ marginTop: 18 }}>
          Paid{booking.paidOutsideMethod ? ` · ${booking.paidOutsideMethod}` : ""}. Thank you!
        </p>
      )}

      {showPay && (
        <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, marginTop: 18 }}>
          <p className="name" style={{ margin: 0 }}>
            Prefer to pay {stylist.name.split(" ")[0]} with Venmo, Cash App or Zelle?
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stylist.venmoHandle && (
              <a
                className="btn-ghost"
                style={{ padding: "8px 14px", fontSize: 13 }}
                href={venmoUrl(stylist.venmoHandle, booking.priceCents, payNote)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pay with Venmo
              </a>
            )}
            {stylist.cashAppHandle && (
              <a
                className="btn-ghost"
                style={{ padding: "8px 14px", fontSize: 13 }}
                href={cashAppUrl(stylist.cashAppHandle, booking.priceCents)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pay with Cash App
              </a>
            )}
          </div>
          {stylist.zelleInfo && <p className="subtle" style={{ margin: 0 }}>Zelle: {stylist.zelleInfo}</p>}
          <p className="subtle" style={{ margin: 0, fontSize: 12 }}>
            Optional — you can also just pay at your appointment.
          </p>
        </div>
      )}

      {booking.business.address && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(booking.business.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="subtle"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 14 }}
        >
          <MapPin size={13} /> View on map
        </a>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid rgba(36, 28, 31, 0.1)",
      }}
    >
      <span className="subtle">{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
