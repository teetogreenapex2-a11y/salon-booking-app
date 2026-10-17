"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/admin/BarcodeScanner";

type Svc = { id: string; name: string };
type Extra = { id: string; name: string; priceCents: number };

// Adds extra services (e.g. a toner) to a client's bill — scan the service's
// QR label or pick it from the list. Raises the booking total.
export default function AddServiceToBill({
  bookingId,
  services,
  extras,
}: {
  bookingId: string;
  services: Svc[];
  extras: Extra[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState("");

  async function add(body: { code?: string; serviceId?: string }) {
    const res = await fetch(`/api/admin/bookings/${bookingId}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "Couldn't add that.");
      return;
    }
    setMsg(`Added ${data.name} — $${(data.priceCents / 100).toFixed(2)}`);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/bookings/${bookingId}/extras?extraId=${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (!open) {
    return (
      <div>
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setOpen(true)}>
          Add service
        </button>
        {extras.length > 0 && (
          <div className="subtle" style={{ fontSize: 11, marginTop: 2 }}>
            + {extras.map((e) => e.name).join(", ")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, minWidth: 240, padding: 12 }}>
      <BarcodeScanner onScan={(code) => add({ code })} />
      <div style={{ display: "flex", gap: 8 }}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
          <option value="">Or pick a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          className="btn-primary"
          style={{ padding: "6px 12px", fontSize: 12 }}
          disabled={!pick}
          onClick={() => { add({ serviceId: pick }); setPick(""); }}
        >
          Add
        </button>
      </div>
      {msg && <p className="subtle" style={{ margin: 0, fontWeight: 600 }}>{msg}</p>}
      {extras.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
          <span style={{ flex: 1 }}>{e.name} · ${(e.priceCents / 100).toFixed(2)}</span>
          <button className="btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => remove(e.id)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, alignSelf: "flex-start" }} onClick={() => { setOpen(false); setMsg(""); }}>
        Done
      </button>
    </div>
  );
}
