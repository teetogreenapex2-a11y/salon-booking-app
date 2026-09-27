"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  tag: string | null;
  active: boolean;
};

export default function ServiceManager({
  businessId,
  initialServices,
}: {
  businessId: string;
  initialServices: Service[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("45");
  const [price, setPrice] = useState("65");
  const [saving, setSaving] = useState(false);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        name,
        durationMin: Number(duration),
        priceCents: Math.round(Number(price) * 100),
      }),
    });
    const created = await res.json();
    setServices((s) => [...s, created]);
    setName("");
    setDuration("45");
    setPrice("65");
    setSaving(false);
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setServices((list) => list.map((s) => (s.id === id ? { ...s, active: !active } : s)));
    router.refresh();
  }

  return (
    <div>
      <div className="list" style={{ marginBottom: 28 }}>
        {services.map((s) => (
          <div key={s.id} className="card static" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="name">
                {s.name}
                {!s.active && <span className="subtle"> (inactive)</span>}
              </p>
              <p className="subtle" style={{ margin: "2px 0 0" }}>
                {s.durationMin} min · ${(s.priceCents / 100).toFixed(0)}
              </p>
            </div>
            <button
              className="btn-ghost"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => toggleActive(s.id, s.active)}
            >
              {s.active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        ))}
        {services.length === 0 && <p className="subtle">No services yet — add one below.</p>}
      </div>

      <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>
        Add a service
      </h2>
      <form
        onSubmit={addService}
        className="customer-form"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 360 }}
      >
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Duration (minutes)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <input
          placeholder="Price (dollars)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add service"}
        </button>
      </form>
    </div>
  );
}
