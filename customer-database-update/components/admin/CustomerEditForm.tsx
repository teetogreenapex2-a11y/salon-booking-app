"use client";

import { useState } from "react";

type Stylist = { id: string; name: string };
type Customer = {
  id: string;
  notes: string | null;
  allergies: string | null;
  preferredStylistId: string | null;
};

export default function CustomerEditForm({
  customer,
  stylists,
}: {
  customer: Customer;
  stylists: Stylist[];
}) {
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [allergies, setAllergies] = useState(customer.allergies ?? "");
  const [preferredStylistId, setPreferredStylistId] = useState(
    customer.preferredStylistId ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          allergies: allergies || null,
          preferredStylistId: preferredStylistId || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="customer-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
      <label className="subtle" style={{ fontSize: 13 }}>
        Preferred stylist
      </label>
      <select
        value={preferredStylistId}
        onChange={(e) => setPreferredStylistId(e.target.value)}
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(36, 28, 31, 0.15)",
          borderRadius: 4,
          fontSize: 14,
          fontFamily: "inherit",
          background: "#fff",
        }}
      >
        <option value="">No preference</option>
        {stylists.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label className="subtle" style={{ fontSize: 13, marginTop: 8 }}>
        Allergies
      </label>
      <input
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        placeholder="e.g. sensitive to ammonia-based color"
      />

      <label className="subtle" style={{ fontSize: 13, marginTop: 8 }}>
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Anything worth remembering about this customer"
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(36, 28, 31, 0.15)",
          borderRadius: 4,
          fontSize: 14,
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 22px", fontSize: 14 }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="subtle" style={{ color: "#2e7d32" }}>Saved</span>}
      </div>
    </div>
  );
}
