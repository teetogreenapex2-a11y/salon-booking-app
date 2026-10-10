import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { displayEmail } from "@/lib/placeholderEmail";
import { dayInZone } from "@/lib/waitlist";
import RemoveWaitlistButton from "@/components/admin/RemoveWaitlistButton";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const business = await requireOwner();
  const today = dayInZone(new Date(), business.timezone);
  const entries = await prisma.waitlistEntry.findMany({
    where: { businessId: business.id, day: { gte: today } },
    include: { stylist: true, service: true },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="display">Waitlist</h1>
      <p className="subtle">
        Customers who asked to be told if a fully booked day opens up. When someone cancels, everyone waiting for
        that stylist and day gets an email.
      </p>
      {entries.length === 0 ? (
        <p className="subtle">Nobody is waiting right now.</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <strong>{e.name}</strong> — {e.service.name} with {e.stylist.name}
              <div className="subtle">
                {new Date(`${e.day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {displayEmail(e.email)}
                {e.phone ? ` · ${e.phone}` : ""}
                {" · "}
                {e.status === "NOTIFIED" ? "Emailed — a spot opened" : "Waiting"}
              </div>
            </div>
            <RemoveWaitlistButton id={e.id} />
          </div>
        ))
      )}
    </div>
  );
}
