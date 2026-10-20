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
      <input style={box} placeholder="Service name (e.g. Balayage)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
        <input style={{ ...box, flex: "1 1 130px" }} type="number" min="1" placeholder="Price ($)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input style={{ ...box, flex: "1 1 130px" }} type="number" min="5" step="5" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      {error && <p style={{ color: "#b3563e", fontSize: 13, margin: 0 }}>{error}</p>}
      <button className="btn-primary" onClick={add} disabled={saving || !name.trim() || !price || !duration}>
        {saving ? "Adding…" : "Add service"}
      </button>
    </div>
  );
}
