"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_SUGGESTIONS } from "@/lib/categories";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  depositCents?: number;
  category?: string | null;
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
  const [deposit, setDeposit] = useState("0");
  const [category, setCategory] = useState("");
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
        depositCents: Math.round(Number(deposit || 0) * 100),
        category,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Couldn't add service — try signing in again and retrying.");
      return;
    }
    const created = await res.json();
    setServices((s) => [...s, created]);
    setName("");
    setDuration("45");
    setPrice("65");
    setDeposit("0");
    setCategory("");
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

  async function saveCategory(id: string, value: string) {
    const clean = value.trim().replace(/\s+/g, " ").slice(0, 40) || null;
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: clean }),
    });
    if (!res.ok) {
      alert("Couldn't save the category — try again.");
      return;
    }
    setServices((list) => list.map((s) => (s.id === id ? { ...s, category: clean } : s)));
    router.refresh();
  }

  async function saveDeposit(id: string, dollars: string) {
    const depositCents = Math.max(0, Math.round(Number(dollars || 0) * 100));
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositCents }),
    });
    if (!res.ok) {
      alert("Couldn't save the deposit — try again.");
      return;
    }
    setServices((list) => list.map((s) => (s.id === id ? { ...s, depositCents } : s)));
    router.refresh();
  }

  return (
    <div>
      <datalist id="service-categories">
        {CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <p className="subtle" style={{ marginBottom: 14, maxWidth: 520 }}>
        Give each service a category (Hair, Nails…) and clients see your menu grouped under those headings.
      </p>
      <p className="subtle" style={{ marginBottom: 14, maxWidth: 520 }}>
        Deposits are charged by card when the customer books (needs Stripe connected in Billing). Leave at $0 for none.
        If the customer cancels before your cancellation cutoff, the deposit is refunded automatically.
      </p>
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
              <label className="subtle" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, marginRight: 14 }}>
                Category
                <input
                  list="service-categories"
                  defaultValue={s.category ?? ""}
                  placeholder="e.g. Hair"
                  onBlur={(e) => {
                    if (e.target.value.trim() !== (s.category ?? "")) saveCategory(s.id, e.target.value);
                  }}
                  style={{ width: 120 }}
                />
              </label>
              <label className="subtle" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                Deposit $
                <input
                  type="number"
                  min="0"
                  defaultValue={((s.depositCents ?? 0) / 100).toString()}
                  onBlur={(e) => {
                    if (Math.round(Number(e.target.value || 0) * 100) !== (s.depositCents ?? 0)) saveDeposit(s.id, e.target.value);
                  }}
                  style={{ width: 70 }}
                />
              </label>
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
        <label>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Service name</span>
          <input placeholder="e.g. Balayage" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
        </label>
        <label>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Category (optional)</span>
          <input
            list="service-categories"
            placeholder="e.g. Hair, Nails"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <label>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Duration (minutes)</span>
          <input
            placeholder="e.g. 60"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <label>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Price ($)</span>
          <input
            placeholder="e.g. 85"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <label>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Deposit at booking ($, 0 = none)</span>
          <input
            type="number"
            min="0"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add service"}
        </button>
      </form>
    </div>
  );
}
