import { prisma } from "@/lib/prisma";
import CancelBookingButton from "@/components/CancelBookingButton";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { startsAt: "desc" },
    include: { service: true, stylist: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Bookings
      </h1>
      {bookings.length === 0 ? (
        <p className="subtle">No bookings yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Stylist</th>
                <th>When</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>
                    {b.customerEmail}
                    {b.customerPhone ? ` · ${b.customerPhone}` : ""}
                  </td>
                  <td>{b.service.name}</td>
                  <td>{b.stylist.name}</td>
                  <td>
                    {b.startsAt.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className={`status-pill status-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.status === "CONFIRMED" && <CancelBookingButton id={b.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
