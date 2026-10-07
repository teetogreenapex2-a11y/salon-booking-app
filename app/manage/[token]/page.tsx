import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import { bookingByToken } from "@/lib/manageBooking";
import { changeStatus, formatWhen } from "@/lib/manage";
import ManageBooking from "@/components/ManageBooking";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your appointment", robots: { index: false, follow: false } };

export default async function ManagePage({ params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) notFound();

  const state = changeStatus(booking, booking.business.cancelCutoffHours);
  const when = formatWhen(booking.startsAt, booking.business.timezone);

  return (
    <main className="page">
      <div className="hero">
        <Scissors size={32} color="var(--berry)" />
      </div>
      <h1 className="display title" style={{ fontSize: 24 }}>
        {booking.business.name}
      </h1>
      <p className="tagline" style={{ marginBottom: 24 }}>
        Your appointment
      </p>

      <ManageBooking
        token={params.token}
        businessName={booking.business.name}
        businessSlug={booking.business.slug}
        serviceName={booking.service.name}
        stylistName={booking.stylist.name}
        whenLabel={when}
        status={booking.status}
        state={state}
        cutoffHours={booking.business.cancelCutoffHours}
      />
    </main>
  );
}
