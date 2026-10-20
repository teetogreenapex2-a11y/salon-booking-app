"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddServiceForm({ stylistId }: { stylistId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/stylists/${stylistId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, durationMin: duration }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't add that — try again.");
      return;
    }
    setName("");
    setPrice("");
    setDuration("");
    router.refresh();
  }

  const box = { width: "100%", boxSizing: "border-box" as const, minWidth: 0 };

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10, marginBottom: 20, maxWidth: "100%", minWidth: 0 }}>
      <p className="name">Add a service</p>
      <p className="subtle" style={{ fontSize: 12, margin: 0 }}>
        It starts out for you only. Your salon owner can turn it on for other stylists.
      </p>
      <label style={{ display: "block", minWidth: 0 }}>
        <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Service name</span>
        <input style={box} placeholder="e.g. Balayage" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
        <label style={{ display: "block", minWidth: 0 }}>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Price ($)</span>
          <input style={box} type="number" min="1" placeholder="e.g. 85" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label style={{ display: "block", minWidth: 0 }}>
          <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Duration (minutes)</span>
          <input style={box} type="number" min="5" step="5" placeholder="e.g. 60" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
      </div>
      {error && <p style={{ color: "#b3563e", fontSize: 13, margin: 0 }}>{error}</p>}
      <button className="btn-primary" onClick={add} disabled={saving || !name.trim() || !price || !duration}>
        {saving ? "Adding…" : "Add service"}
      </button>
    </div>
  );
}
