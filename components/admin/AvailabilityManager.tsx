"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Availability = { id: string; dayOfWeek: number; startMin: number; endMin: number };
type Stylist = { id: string; name: string; availability: Availability[] };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMin(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

type Row = { open: boolean; start: string; end: string };

function buildRows(stylist?: Stylist): Record<number, Row> {
  const initial: Record<number, Row> = {};
  for (let d = 0; d < 7; d++) {
    const w = stylist?.availability.find((a) => a.dayOfWeek === d);
    initial[d] = w
      ? { open: true, start: minToTime(w.startMin), end: minToTime(w.endMin) }
      : { open: false, start: "09:00", end: "17:00" };
  }
  return initial;
}

export default function AvailabilityManager({ stylists }: { stylists: Stylist[] }) {
  const router = useRouter();
  const [activeStylistId, setActiveStylistId] = useState(stylists[0]?.id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const activeStylist = stylists.find((s) => s.id === activeStylistId);
  const [rows, setRows] = useState<Record<number, Row>>(() => buildRows(activeStylist));

  function selectStylist(id: string) {
    setActiveStylistId(id);
    setRows(buildRows(stylists.find((s) => s.id === id)));
    setSaved(false);
  }

  async function save() {
    if (!activeStylistId) return;
    setSaving(true);
    setSaved(false);
    setError(false);
    const windows = Object.entries(rows)
      .filter(([, v]) => v.open)
      .map(([day, v]) => ({
        dayOfWeek: Number(day),
        startMin: timeToMin(v.start),
        endMin: timeToMin(v.end),
      }));

    const res = await fetch(`/api/admin/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stylistId: activeStylistId, windows }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(true);
    }
  }

  if (!activeStylist) {
    return <p className="subtle">Add a stylist first, then come back here to set their hours.</p>;
  }

  return (
    <div>
      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap", justifyContent: "flex-start" }}>
        {stylists.map((s) => (
          <button
            key={s.id}
            className={`btn-ghost ${s.id === activeStylistId ? "selected-tab" : ""}`}
            style={{ padding: "8px 14px", fontSize: 13 }}
            onClick={() => selectStylist(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="list" style={{ maxWidth: 480 }}>
        {DAYS.map((label, d) => (
          <div key={d} className="card static" style={{ justifyContent: "space-between", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
              <input
                type="checkbox"
                checked={rows[d].open}
                onChange={(e) =>
                  setRows((r) => ({ ...r, [d]: { ...r[d], open: e.target.checked } }))
                }
              />
              {label}
            </label>
            {rows[d].open && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="time"
                  value={rows[d].start}
                  onChange={(e) =>
                    setRows((r) => ({ ...r, [d]: { ...r[d], start: e.target.value } }))
                  }
                />
                <input
                  type="time"
                  value={rows[d].end}
                  onChange={(e) =>
                    setRows((r) => ({ ...r, [d]: { ...r[d], end: e.target.value } }))
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: 20, width: "auto", padding: "12px 24px" }}
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save hours"}
      </button>
      {saved && <p className="subtle" style={{ color: "#2e7d32", marginTop: 8 }}>Saved.</p>}
      {error && (
        <p className="subtle" style={{ color: "#c62828", marginTop: 8 }}>
          Couldn&rsquo;t save — try signing in again and retrying.
        </p>
      )}
    </div>
  );
}
