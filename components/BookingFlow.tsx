"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import CardOnFileStep from "./CardOnFileStep";

type Service = { id: string; name: string; durationMin: number; priceCents: number; tag: string | null };
type Stylist = { id: string; name: string; specialty: string | null };
type Override = { stylistId: string; serviceId: string; priceCents: number | null; durationMin: number | null };

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

export default function BookingFlow({
  businessSlug,
  services,
  stylists,
  overrides,
}: {
  businessSlug: string;
  services: Service[];
  stylists: Stylist[];
  overrides: Override[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "calendar" | "card">("select");
  const [service, setService] = useState<Service | null>(null);
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [effectiveDurationMin, setEffectiveDurationMin] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [slots, setSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [smsConsent, setSmsConsent] = useState(false);
  const [pendingStartMin, setPendingStartMin] = useState<number | null>(null);

  const week = useMemo(() => buildWeek(weekOffset), [weekOffset]);

  const overrideMap = useMemo(() => {
    const m = new Map<string, { priceCents: number | null; durationMin: number | null }>();
    for (const o of overrides) m.set(`${o.stylistId}:${o.serviceId}`, o);
    return m;
  }, [overrides]);

  function effectiveFor(sty: Stylist, svc: Service) {
    const o = overrideMap.get(`${sty.id}:${svc.id}`);
    return {
      priceCents: o?.priceCents ?? svc.priceCents,
      durationMin: o?.durationMin ?? svc.durationMin,
    };
  }

  async function loadSlots(idx: number, off: number, sty: Stylist, svc: Service) {
    setLoadingSlots(true);
    const date = buildWeek(off)[idx];
    const res = await fetch(
      `/api/bookings/slots?stylistId=${sty.id}&serviceId=${svc.id}&date=${date.toISOString()}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  function goToCalendar(svc: Service, sty: Stylist) {
    setService(svc);
    setStylist(sty);
    setEffectiveDurationMin(effectiveFor(sty, svc).durationMin);
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

  function handleSlotClick(startMin: number) {
    if (!customer.name || !customer.email || !customer.phone) {
      alert("Fill in your name, email, and phone number above first.");
      return;
    }
    setPendingStartMin(startMin);
    setStep("card");
  }

  async function submitBooking(customerId: string | null) {
    if (!service || !stylist || pendingStartMin === null) return;
    setSubmitting(true);
    const date = week[dateIdx];
    const startsAt = new Date(date);
    startsAt.setHours(0, pendingStartMin, 0, 0);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        serviceId: service.id,
        stylistId: stylist.id,
        startsAt: startsAt.toISOString(),
        customer,
        customerId,
        smsConsent,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const booking = await res.json();
      router.push(`/${businessSlug}/book/confirm?id=${booking.id}`);
    } else {
      alert("That slot was just booked — pick another time.");
      setStep("calendar");
      setPendingStartMin(null);
      loadSlots(dateIdx, weekOffset, stylist, service);
    }
  }

  if (step === "select") {
    return (
      <div>
        <StepBar current={0} />
        <SelectStep
          services={services}
          stylists={stylists}
          effectiveFor={effectiveFor}
          onNext={goToCalendar}
        />
      </div>
    );
  }

  if (step === "card") {
    return (
      <div>
        <StepBar current={2} />
        <button className="back-link" onClick={() => setStep("calendar")} disabled={submitting}>
          <ChevronLeft size={16} /> Back
        </button>
        {submitting ? (
          <p className="subtle" style={{ marginTop: 16 }}>Confirming your booking…</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            <CardOnFileStep
              businessSlug={businessSlug}
              stylistId={stylist?.id ?? ""}
              customer={customer}
              onDone={submitBooking}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <StepBar current={1} />
      <button className="back-link" onClick={() => setStep("select")}>
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="display" style={{ fontSize: 24, margin: "12px 0 4px" }}>Pick a date & time</h2>
      <p className="subtle" style={{ marginBottom: 20 }}>
        {service?.name} with {stylist?.name}
        {effectiveDurationMin ? ` · ${effectiveDurationMin} min` : ""}
      </p>

      <CustomerForm customer={customer} onChange={setCustomer} smsConsent={smsConsent} onSmsConsent={setSmsConsent} />

      <div className="week-nav" style={{ marginTop: 24 }}>
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
            <button key={m} className="slot-btn" onClick={() => handleSlotClick(m)} disabled={submitting}>
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
  effectiveFor,
  onNext,
}: {
  services: Service[];
  stylists: Stylist[];
  effectiveFor: (sty: Stylist, svc: Service) => { priceCents: number; durationMin: number };
  onNext: (s: Service, st: Stylist) => void;
}) {
  const [sty, setSty] = useState<Stylist | null>(null);
  const [svc, setSvc] = useState<Service | null>(null);

  function pickStylist(s: Stylist) {
    setSty(s);
    setSvc(null);
  }

  return (
    <div>
      <h2 className="display" style={{ fontSize: 24, marginBottom: 16 }}>Choose your stylist</h2>
      <div className="list">
        {stylists.map((s) => (
          <button key={s.id} className={`card ${sty?.id === s.id ? "selected" : ""}`} onClick={() => pickStylist(s)}>
            <p className="name">{s.name}</p>
            {s.specialty && <p className="subtle" style={{ margin: "2px 0 0" }}>{s.specialty}</p>}
          </button>
        ))}
      </div>

      {sty && (
        <>
          <h2 className="display" style={{ fontSize: 24, margin: "28px 0 16px" }}>
            Choose a service with {sty.name}
          </h2>
          {(() => {
            const offered = services.filter((s) => effectiveFor(sty, s).priceCents !== 0);
            if (offered.length === 0) {
              return <p className="subtle">{sty.name} doesn&rsquo;t offer any services right now.</p>;
            }
            return (
              <div className="list">
                {offered.map((s) => {
                  const eff = effectiveFor(sty, s);
                  return (
                    <button key={s.id} className={`card ${svc?.id === s.id ? "selected" : ""}`} onClick={() => setSvc(s)}>
                      <div className="row">
                        <div>
                          <div className="row" style={{ gap: 8 }}>
                            <span className="name">{s.name}</span>
                            {s.tag && <span className="tag">{s.tag}</span>}
                          </div>
                          <div className="row subtle" style={{ marginTop: 4, fontSize: 12 }}>
                            <Clock size={12} /> {eff.durationMin} min
                          </div>
                        </div>
                        <span className="display price">${(eff.priceCents / 100).toFixed(0)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      <button className="btn-primary" style={{ marginTop: 20 }} disabled={!svc || !sty} onClick={() => svc && sty && onNext(svc, sty)}>
        Continue to calendar
      </button>
    </div>
  );
}

function CustomerForm({
  customer,
  onChange,
  smsConsent,
  onSmsConsent,
}: {
  customer: { name: string; email: string; phone: string };
  onChange: (c: { name: string; email: string; phone: string }) => void;
  smsConsent: boolean;
  onSmsConsent: (v: boolean) => void;
}) {
  return (
    <div className="customer-form">
      <p className="subtle" style={{ fontWeight: 500, marginBottom: 8 }}>Your details</p>
      <input
        placeholder="Full name"
        value={customer.name}
        onChange={(e) => onChange({ ...customer, name: e.target.value })}
      />
      <input
        placeholder="Email"
        type="email"
        value={customer.email}
        onChange={(e) => onChange({ ...customer, email: e.target.value })}
      />
      <input
        placeholder="Phone"
        type="tel"
        value={customer.phone}
        onChange={(e) => onChange({ ...customer, phone: e.target.value })}
      />
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => onSmsConsent(e.target.checked)}
          style={{ width: "auto", marginTop: 3, flexShrink: 0 }}
        />
        <span>
          Text me appointment confirmation and reminder messages about my booking. Sent through
          Hairsalonix on behalf of the business I'm booking with, which is operated by Tee to Green Golf.
          Message frequency varies (about 1 confirmation and 1 reminder per appointment). Msg &amp; data
          rates may apply. Reply HELP for help, STOP to opt out. Consent is not required to book. See our{" "}
          <a href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </span>
      </label>
      <p className="subtle" style={{ fontSize: 12, marginTop: 6 }}>
        Fill this in, then pick a time below.
      </p>
    </div>
  );
}

// Choose -> Time -> Confirm progress indicator.
function StepBar({ current }: { current: 0 | 1 | 2 }) {
  const labels = ["Choose", "Time", "Confirm"];
  return (
    <div className="stepbar" aria-label={`Step ${current + 1} of 3`}>
      {labels.map((label, i) => (
        <div key={label} style={{ display: "contents" }}>
          <div className={`step ${i < current ? "done" : i === current ? "current" : ""}`}>
            <span className="dot">{i < current ? "✓" : i + 1}</span>
            <span>{label}</span>
          </div>
          {i < labels.length - 1 && <div className={`line ${i < current ? "done" : ""}`} />}
        </div>
      ))}
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
