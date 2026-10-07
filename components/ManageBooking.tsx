"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  token: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  stylistName: string;
  whenLabel: string;
  status: string;
  state: "ok" | "closed" | "too_late";
  cutoffHours: number;
};

function buildWeek(offset: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = offset; i < offset + 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function ManageBooking(p: Props) {
  const [mode, setMode] = useState<"view" | "reschedule" | "confirmCancel" | "done">("view");
  const [doneText, setDoneText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [slots, setSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const week = useMemo(() => buildWeek(weekOffset), [weekOffset]);

  async function loadSlots(off: number, idx: number) {
    setLoadingSlots(true);
    setError("");
    try {
      const date = buildWeek(off)[idx];
      const res = await fetch(`/api/manage/${p.token}/slots?date=${encodeURIComponent(date.toISOString())}`);
      const data = await res.json().catch(() => ({}));
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }

  function startReschedule() {
    setMode("reschedule");
    setWeekOffset(0);
    setDateIdx(0);
    loadSlots(0, 0);
  }

  function selectDate(i: number) {
    setDateIdx(i);
    loadSlots(weekOffset, i);
  }

  function changeWeek(delta: number) {
    const next = Math.max(0, weekOffset + delta);
    setWeekOffset(next);
    setDateIdx(0);
    loadSlots(next, 0);
  }

  async function pickSlot(min: number) {
    const startsAt = new Date(week[dateIdx]);
    startsAt.setHours(0, min, 0, 0);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/manage/${p.token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: startsAt.toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDoneText(
          `You're rescheduled for ${startsAt.toLocaleString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}. We emailed you the new time.`
        );
        setMode("done");
      } else {
        setError(data.error || "Couldn't reschedule — please try again.");
        if (res.status === 409) loadSlots(weekOffset, dateIdx);
      }
    } catch {
      setError("Couldn't reach the server — please try again.");
    }
    setBusy(false);
  }

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/manage/${p.token}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDoneText("Your appointment is cancelled. We emailed you a confirmation.");
        setMode("done");
      } else {
        setError(data.error || "Couldn't cancel — please try again.");
        setMode("view");
      }
    } catch {
      setError("Couldn't reach the server — please try again.");
    }
    setBusy(false);
  }

  if (mode === "done") {
    return (
      <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
        <p className="name" style={{ margin: 0 }}>{doneText}</p>
        <a className="btn-ghost" style={{ textAlign: "center" }} href={`/${p.businessSlug}`}>
          Back to {p.businessName}
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>
        <Row label="When" value={p.whenLabel} />
        <Row label="Service" value={p.serviceName} />
        <Row label="Stylist" value={p.stylistName} />
        <Row label="Status" value={p.status === "CONFIRMED" ? "Confirmed" : p.status === "CANCELLED" ? "Cancelled" : p.status === "COMPLETED" ? "Completed" : p.status} />
      </div>

      {error && <p className="subtle" style={{ color: "#c62828", marginTop: 14 }}>{error}</p>}

      {mode === "view" && p.state === "ok" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={startReschedule}>Reschedule</button>
          <button className="btn-ghost" onClick={() => setMode("confirmCancel")}>Cancel appointment</button>
        </div>
      )}

      {mode === "view" && p.state === "too_late" && (
        <p className="subtle" style={{ marginTop: 18 }}>
          Changes close {p.cutoffHours} hours before your appointment. Please contact {p.businessName} directly.
        </p>
      )}

      {mode === "view" && p.state === "closed" && (
        <p className="subtle" style={{ marginTop: 18 }}>
          {p.status === "CANCELLED" ? "This appointment was cancelled." : "This appointment can't be changed anymore."}{" "}
          <a href={`/${p.businessSlug}`} style={{ textDecoration: "underline" }}>Book a new one</a>
        </p>
      )}

      {mode === "confirmCancel" && (
        <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 12, marginTop: 20 }}>
          <p className="name" style={{ margin: 0 }}>Cancel this appointment?</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={cancel} disabled={busy}>
              {busy ? "Cancelling…" : "Yes, cancel it"}
            </button>
            <button className="btn-ghost" onClick={() => setMode("view")} disabled={busy}>Keep it</button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div style={{ marginTop: 24 }}>
          <button className="back-link" onClick={() => setMode("view")}>
            <ChevronLeft size={16} /> Back
          </button>
          <h2 className="display" style={{ fontSize: 22, margin: "12px 0 14px" }}>Pick a new time</h2>

          <div className="week-nav">
            <button className="icon-btn" onClick={() => changeWeek(-7)} disabled={weekOffset === 0}>
              <ChevronLeft size={16} />
            </button>
            <span>{week[0].toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            <button className="icon-btn" onClick={() => changeWeek(7)}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="day-strip">
            {week.map((d, i) => (
              <div key={i} className={`day-cell ${i === dateIdx ? "selected" : ""}`} onClick={() => selectDate(i)}>
                <span className="dow">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="dom">{d.getDate()}</span>
              </div>
            ))}
          </div>

          <p className="subtle" style={{ margin: "18px 0 8px", fontWeight: 500 }}>
            Available times — {week[dateIdx].toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </p>

          {loadingSlots ? (
            <p className="subtle">Loading times…</p>
          ) : slots.length === 0 ? (
            <p className="subtle">No openings this day — try another date.</p>
          ) : (
            <div className="slot-grid">
              {slots.map((m) => (
                <button key={m} className="slot-btn" onClick={() => pickSlot(m)} disabled={busy}>
                  {minutesToLabel(m)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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
