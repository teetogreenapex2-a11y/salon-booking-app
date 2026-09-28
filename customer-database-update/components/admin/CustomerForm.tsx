"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stylist = { id: string; name: string };
type Customer = {
  id: string;
  notes: string | null;
  allergies: string | null;
  preferredStylistId: string | null;
};

export default function CustomerForm({
  customer,
  stylists,
}: {
  customer: Customer;
  stylists: Stylist[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [allergies, setAllergies] = useState(customer.allergies ?? "");
  const [preferredStylistId, setPreferredStylistId] = useState(customer.preferredStylistId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/customers/${customer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: notes || null,
        allergies: allergies || null,
        preferredStylistId: preferredStylistId || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="customer-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 480 }}>
      <label className="subtle" style={{ fontSize: 12 }}>Preferred stylist</label>
      <select
        value={preferredStylistId}
        onChange={(e) => setPreferredStylistId(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 4, border: "1px solid rgba(36,28,31,0.15)", fontSize: 14 }}
      >
        <option value="">No preference set</option>
        {stylists.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Allergies / sensitivities</label>
      <input
        placeholder="e.g. sensitive to ammonia-based color"
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
      />

      <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Notes (formulas, preferences, anything worth remembering)</label>
      <textarea
        placeholder="e.g. 6N base + 20 vol, 35 min. Prefers round brush blowout."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        style={{ padding: "10px 12px", borderRadius: 4, border: "1px solid rgba(36,28,31,0.15)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
      />

      <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto", padding: "12px 22px" }}>
        {saving ? "Saving…" : "Save notes"}
      </button>
      {saved && <p className="subtle" style={{ color: "#2e7d32" }}>Saved.</p>}
    </form>
  );
}
