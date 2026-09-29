"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

type Service = { id: string; name: string; durationMin: number; priceCents: number; tag: string | null };
type Stylist = { id: string; name: string; specialty: string | null };
type Customer = { id: string; name: string; email: string; phone: string | null };

function buildWeek(offset: number) {
  const days = [];
  const today = new Date();
  for (let i = offset; i < offset + 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// Admin-side version of BookingFlow: the customer is already known (pulled
// from their file), so this skips the name/email/phone form and books
// straight onto their record via the same /api/bookings endpoint the
// public booking page uses.
export default function AdminBookingFlow({
  businessSlug,
  services,
  stylists,
  customer,
}: {
  businessSlug: string;
  services: Service[];
  stylists: Stylist[];
  customer: Customer;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "calendar">("select");
  const [service, setService] = useState<Service | null>(null);
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [slots, setSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const week = useMemo(() => buildWeek(weekOffset), [weekOffset]);

  async function loadSlots(idx: number, off: number, sty: Stylist, svc: Service) {
    setLoadingSlots(true);
    const date = buildWeek(off)[idx];
    const res = await fetch(
      `/api/bookings/slots?stylistId=${sty.id}&durationMin=${svc.durationMin}&date=${date.toISOString()}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  function goToCalendar(svc: Service, sty: Stylist) {
    setService(svc);
    setStylist(sty);
    setStep("calendar");
    loadSlots(dateIdx, weekOffset, sty, svc);
  }

  async function selectDate(idx: number) {
    setDateIdx(idx);
    if (stylist && service) await loadSlots(idx, weekOffset, stylist, service);
  }

  async function changeWeek(delta: number) {
    const off = Math.max(0, weekOffset + delta);
    setWeekOffset(off);
    setDateIdx(0);
    if (stylist && service) await loadSlots(0, off, stylist, service);
  }

  async function confirmBooking(startMin: number) {
    if (!service || !stylist) return;
    setSubmitting(true);
    const date = week[dateIdx];
    const startsAt = new Date(date);
    startsAt.setHours(0, startMin, 0, 0);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        serviceId: service.id,
        stylistId: stylist.id,
        startsAt: startsAt.toISOString(),
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
        },
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push(`/admin/customers/${customer.id}?booked=1`);
    } else {
      alert("That slot was just booked — pick another time.");
      loadSlots(dateIdx, weekOffset, stylist, service);
    }
  }

  if (step === "select") {
    return <SelectStep services={services} stylists={stylists} onNext={goToCalendar} />;
  }

  return (
    <div>
      <button className="back-link" onClick={() => setStep("select")}>
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="display" style={{ fontSize: 24, margin: "12px 0 4px" }}>Pick a date & time</h2>
      <p className="subtle">
        Booking for {customer.name} with {stylist?.name}
        {stylist?.specialty ? ` · ${stylist.specialty}` : ""}
      </p>

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

      <p className="subtle" style={{ margin: "18px 0 8px", fontWeight: 600 }}>
        Available times — {week[dateIdx].toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
      </p>

      {loadingSlots ? (
        <p className="subtle">Loading times…</p>
      ) : slots.length === 0 ? (
        <p className="subtle">No openings this day — try another date.</p>
      ) : (
        <div className="slot-grid">
          {slots.map((m) => (
            <button key={m} className="slot-btn" onClick={() => confirmBooking(m)} disabled={submitting}>
              {minutesToLabel(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectStep({
  services,
  stylists,
  onNext,
}: {
  services: Service[];
  stylists: Stylist[];
  onNext: (s: Service, st: Stylist) => void;
}) {
  const [svc, setSvc] = useState<Service | null>(null);
  const [sty, setSty] = useState<Stylist | null>(null);

  return (
    <div>
      <h2 className="display" style={{ fontSize: 24, marginBottom: 16 }}>Choose a service</h2>
      <div className="list">
        {services.map((s) => (
          <button key={s.id} className={`card ${svc?.id === s.id ? "selected" : ""}`} onClick={() => setSvc(s)}>
            <div className="row">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="name">{s.name}</span>
                  {s.tag && <span className="tag">{s.tag}</span>}
                </div>
                <div className="row subtle" style={{ marginTop: 4, fontSize: 12 }}>
                  <Clock size={12} /> {s.durationMin} min
                </div>
              </div>
              <span className="display price">${(s.priceCents / 100).toFixed(0)}</span>
            </div>
          </button>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: 24, margin: "28px 0 16px" }}>Choose stylist</h2>
      <div className="list">
        {stylists.map((s) => (
          <button key={s.id} className={`card ${sty?.id === s.id ? "selected" : ""}`} onClick={() => setSty(s)}>
            <p className="name">{s.name}</p>
            {s.specialty && <p className="subtle" style={{ margin: "2px 0 0" }}>{s.specialty}</p>}
          </button>
        ))}
      </div>

      <button className="btn-primary" disabled={!svc || !sty} onClick={() => svc && sty && onNext(svc, sty)}>
        Continue to calendar
      </button>
    </div>
  );
}

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}
