import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const SLOT_MINUTES = 15;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
const ROW_HEIGHT = 12; // px per 15-min slot — kept short so the whole day fits with less vertical scrolling

// Consistent color per service, no schema change needed — picked from a
// fixed palette by hashing the service id.
const SERVICE_COLORS = [
  { bg: "#f1d9d4", border: "#7a2e3d", text: "#5c2130" }, // berry/blush
  { bg: "#dbe7e0", border: "#3f6b52", text: "#2c4a38" }, // sage
  { bg: "#dfe6f3", border: "#3a5a9e", text: "#2c4a9e" }, // blue
  { bg: "#f3ead9", border: "#b08d57", text: "#8a6a3a" }, // brass
  { bg: "#e9dcf3", border: "#7a4fa0", text: "#5c3a80" }, // purple
  { bg: "#f3ddd9", border: "#b3563e", text: "#8a3f2c" }, // terracotta
  { bg: "#d9f0ee", border: "#2f8a80", text: "#236a62" }, // teal
  { bg: "#f3e3ec", border: "#a0507e", text: "#803a63" }, // pink
];

function colorForService(serviceId: string) {
  let hash = 0;
  for (let i = 0; i < serviceId.length; i++) {
    hash = (hash * 31 + serviceId.charCodeAt(i)) >>> 0;
  }
  return SERVICE_COLORS[hash % SERVICE_COLORS.length];
}

function formatDateParam(d: Date) {
  return d.toISOString().slice(0, 10);
}

function timeLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h} ${ampm}`;
}

export default async function AdminCalendar({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const business = await prisma.business.findFirst();
  if (!business) {
    return <p className="subtle">No business set up yet.</p>;
  }

  const dateParam = searchParams.date;
  const day = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  day.setHours(0, 0, 0, 0);

  const dayStart = new Date(day);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const prevDay = new Date(day);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const [stylists, bookings] = await Promise.all([
    prisma.stylist.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        startsAt: { gte: dayStart, lt: dayEnd },
      },
      include: { service: true, stylist: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const servicesUsed = new Map<
    string,
    { name: string; color: (typeof SERVICE_COLORS)[number] }
  >();
  for (const b of bookings) {
    if (!servicesUsed.has(b.serviceId)) {
      servicesUsed.set(b.serviceId, {
        name: b.service.name,
        color: colorForService(b.serviceId),
      });
    }
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Calendar
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        {day.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Link href={`/admin/calendar?date=${formatDateParam(prevDay)}`} className="icon-btn">
          ←
        </Link>
        <Link
          href={`/admin/calendar?date=${formatDateParam(new Date())}`}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          Today
        </Link>
        <Link href={`/admin/calendar?date=${formatDateParam(nextDay)}`} className="icon-btn">
          →
        </Link>
      </div>

      {servicesUsed.size > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {[...servicesUsed.values()].map((s) => (
            <span
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "rgba(36,28,31,0.7)",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: s.color.bg,
                  border: `1px solid ${s.color.border}`,
                }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}

      {stylists.length === 0 ? (
        <p className="subtle">No active stylists.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid rgba(36,28,31,0.1)",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `60px repeat(${stylists.length}, minmax(140px, 1fr))`,
              gridTemplateRows: `40px repeat(${TOTAL_SLOTS}, ${ROW_HEIGHT}px)`,
              minWidth: 60 + stylists.length * 140,
              position: "relative",
            }}
          >
            {/* header row */}
            <div
              style={{
                gridColumn: 1,
                gridRow: 1,
                borderBottom: "1px solid rgba(36,28,31,0.1)",
              }}
            />
            {stylists.map((s, i) => (
              <div
                key={s.id}
                style={{
                  gridColumn: i + 2,
                  gridRow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 13,
                  borderBottom: "1px solid rgba(36,28,31,0.1)",
                  borderLeft: "1px solid rgba(36,28,31,0.06)",
                }}
              >
                {s.name}
              </div>
            ))}

            {/* time labels */}
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
              const hour = START_HOUR + i;
              const rowStart = i * SLOTS_PER_HOUR + 2;
              return (
                <div
                  key={hour}
                  style={{
                    gridColumn: 1,
                    gridRow: `${rowStart} / ${rowStart + SLOTS_PER_HOUR}`,
                    fontSize: 11,
                    color: "rgba(36,28,31,0.5)",
                    borderTop: "1px solid rgba(36,28,31,0.08)",
                    paddingTop: 2,
                    textAlign: "right",
                    paddingRight: 6,
                  }}
                >
                  {timeLabel(hour)}
                </div>
              );
            })}

            {/* hour grid lines behind each stylist column */}
            {stylists.map((s, colI) =>
              Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                const rowStart = i * SLOTS_PER_HOUR + 2;
                return (
                  <div
                    key={`${s.id}-${i}`}
                    style={{
                      gridColumn: colI + 2,
                      gridRow: `${rowStart} / ${rowStart + SLOTS_PER_HOUR}`,
                      borderTop: "1px solid rgba(36,28,31,0.08)",
                      borderLeft: "1px solid rgba(36,28,31,0.06)",
                    }}
                  />
                );
              })
            )}

            {/* bookings */}
            {bookings.map((b) => {
              const colIndex = stylists.findIndex((s) => s.id === b.stylistId);
              if (colIndex === -1) return null;

              const startMinutes =
                (b.startsAt.getHours() - START_HOUR) * 60 + b.startsAt.getMinutes();
              const endMinutes =
                (b.endsAt.getHours() - START_HOUR) * 60 + b.endsAt.getMinutes();

              const rowStart = Math.round(startMinutes / SLOT_MINUTES) + 2;
              const rowEnd = Math.round(endMinutes / SLOT_MINUTES) + 2;
              if (rowEnd <= 2 || rowStart >= TOTAL_SLOTS + 2) return null;

              const color = colorForService(b.serviceId);

              return (
                <div
                  key={b.id}
                  title={`${b.customerName} — ${b.service.name} (${b.startsAt.toLocaleTimeString(
                    undefined,
                    { hour: "numeric", minute: "2-digit" }
                  )})`}
                  style={{
                    gridColumn: colIndex + 2,
                    gridRow: `${Math.max(rowStart, 2)} / ${Math.min(rowEnd, TOTAL_SLOTS + 2)}`,
                    margin: "1px 3px",
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    borderLeft: `3px solid ${color.border}`,
                    borderRadius: 4,
                    padding: "4px 6px",
                    fontSize: 11,
                    color: color.text,
                    overflow: "hidden",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {b.customerName}
                  </div>
                  <div
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {b.service.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
