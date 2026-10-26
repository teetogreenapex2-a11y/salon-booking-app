import Link from "next/link";

type Color = { bg: string; border: string; text: string };

export type WeekItem = {
  id: string;
  customerId: string | null;
  customerName: string;
  serviceName: string;
  stylistName: string;
  dayIdx: number; // 0-6 within the week shown
  startMin: number; // minutes after midnight (salon time)
  endMin: number;
  timeLabel: string;
  color: Color;
  paid: boolean;
  confirmed: boolean;
};

export type WeekDay = { dow: string; dom: number; isToday: boolean };

const TIME_COL = 44;
const MIN_DAY_COL = 46;

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
}

// A week for ONE stylist: seven day columns that fit a phone (about 46px
// each). Blocks show the client's first name; tap one to open the client.
export function WeekGrid({
  days,
  items,
  startHour,
  endHour,
  slotMinutes,
  rowHeight,
}: {
  days: WeekDay[];
  items: WeekItem[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
  rowHeight: number;
}) {
  const slotsPerHour = 60 / slotMinutes;
  const totalSlots = (endHour - startHour) * slotsPerHour;

  return (
    <div style={{ overflowX: "auto", border: "1px solid rgba(36,28,31,0.1)", borderRadius: 6, background: "var(--panel)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${TIME_COL}px repeat(7, minmax(${MIN_DAY_COL}px, 1fr))`,
          gridTemplateRows: `44px repeat(${totalSlots}, ${rowHeight}px)`,
          minWidth: TIME_COL + 7 * MIN_DAY_COL,
          position: "relative",
        }}
      >
        <div style={{ gridColumn: 1, gridRow: 1, borderBottom: "1px solid rgba(36,28,31,0.1)" }} />
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              gridColumn: i + 2,
              gridRow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1.15,
              borderBottom: "1px solid rgba(36,28,31,0.1)",
              borderLeft: "1px solid rgba(36,28,31,0.06)",
              background: d.isToday ? "rgba(115,52,58,0.10)" : undefined,
            }}
          >
            <span style={{ fontSize: 11, color: "rgba(36,28,31,0.7)" }}>{d.dow}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: d.isToday ? "#73343A" : undefined }}>{d.dom}</span>
          </div>
        ))}

        {Array.from({ length: endHour - startHour }).map((_, i) => {
          const hour = startHour + i;
          const rowStart = i * slotsPerHour + 2;
          return (
            <div
              key={hour}
              style={{
                gridColumn: 1,
                gridRow: `${rowStart} / ${rowStart + slotsPerHour}`,
                fontSize: 11,
                fontWeight: 600,
                color: "#73343A",
                borderTop: "1px solid rgba(36,28,31,0.08)",
                paddingTop: 2,
                textAlign: "right",
                paddingRight: 4,
              }}
            >
              {hourLabel(hour)}
            </div>
          );
        })}

        {days.map((_, di) =>
          Array.from({ length: endHour - startHour }).map((__, i) => {
            const rowStart = i * slotsPerHour + 2;
            return (
              <div
                key={`${di}-${i}`}
                style={{
                  gridColumn: di + 2,
                  gridRow: `${rowStart} / ${rowStart + slotsPerHour}`,
                  borderTop: "1px solid rgba(36,28,31,0.08)",
                  borderLeft: "1px solid rgba(36,28,31,0.06)",
                }}
              />
            );
          })
        )}

        {items.map((b) => {
          const rowStart = Math.round((b.startMin - startHour * 60) / slotMinutes) + 2;
          const rowEnd = Math.round((b.endMin - startHour * 60) / slotMinutes) + 2;
          if (rowEnd <= 2 || rowStart >= totalSlots + 2) return null;
          const first = (b.customerName || "").trim().split(/\s+/)[0] || "Client";
          const style = {
            gridColumn: b.dayIdx + 2,
            gridRow: `${Math.max(rowStart, 2)} / ${Math.min(rowEnd, totalSlots + 2)}`,
            margin: "1px 2px",
            background: b.color.bg,
            border: `1px solid ${b.color.border}`,
            borderLeft: `3px solid ${b.color.border}`,
            borderRadius: 4,
            padding: "2px 3px",
            fontSize: 10,
            lineHeight: 1.15,
            color: b.color.text,
            overflow: "hidden",
            zIndex: 1,
            textDecoration: "none",
            display: "block",
          } as const;
          const inner = (
            <>
              <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {b.paid && <span style={{ color: "#1b7a3d" }}>$ </span>}
                {first}
              </div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.timeLabel}</div>
            </>
          );
          const title = `${b.customerName} · ${b.serviceName} · ${b.timeLabel}${b.paid ? " · PAID" : ""}${b.confirmed ? " · confirmed" : ""}`;
          return b.customerId ? (
            <Link key={b.id} href={`/admin/customers/${b.customerId}`} title={title} style={style}>
              {inner}
            </Link>
          ) : (
            <div key={b.id} title={title} style={style}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// "This week" as a plain list — easiest to read on a phone.
export function AgendaList({
  groups,
}: {
  groups: { label: string; isToday: boolean; items: (WeekItem & { showStylist: boolean })[] }[];
}) {
  if (groups.length === 0) {
    return <p className="subtle">No appointments this week.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {groups.map((g) => (
        <div key={g.label}>
          <h2
            className="display"
            style={{ fontSize: 16, margin: "0 0 8px", color: g.isToday ? "#73343A" : undefined }}
          >
            {g.label}
            {g.isToday ? " · Today" : ""}
          </h2>
          <div className="list">
            {g.items.map((b) => (
              <div
                key={b.id}
                className="card static"
                style={{ borderLeft: `4px solid ${b.color.border}`, alignItems: "center", justifyContent: "space-between", gap: 12 }}
              >
                <div style={{ minWidth: 0 }}>
                  <p className="name" style={{ margin: 0 }}>
                    {b.timeLabel} · {b.customerName}
                  </p>
                  <p className="subtle" style={{ margin: "2px 0 0", fontSize: 12 }}>
                    {b.serviceName}
                    {b.showStylist ? ` · ${b.stylistName}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {b.confirmed && (
                    <span className="subtle" style={{ fontSize: 11 }}>✓ confirmed</span>
                  )}
                  {b.paid && (
                    <span
                      style={{
                        background: "#1b7a3d",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      PAID
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
