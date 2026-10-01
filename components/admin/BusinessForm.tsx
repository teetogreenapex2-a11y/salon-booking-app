"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  tagline: string | null;
  address: string | null;
  instagram: string | null;
  timezone: string;
  noShowFeeCents: number;
};

export default function BusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...business,
    noShowFeeDollars: (business.noShowFeeCents / 100).toFixed(2),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const noShowFeeCents = Math.round(parseFloat(form.noShowFeeDollars || "0") * 100) || 0;

    await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        tagline: form.tagline,
        address: form.address,
        instagram: form.instagram,
        timezone: form.timezone,
        noShowFeeCents,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="customer-form"
      style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 420 }}
    >
      <input
        placeholder="Salon name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Tagline"
        value={form.tagline ?? ""}
        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
      />
      <input
        placeholder="Address"
        value={form.address ?? ""}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        placeholder="Instagram handle"
        value={form.instagram ?? ""}
        onChange={(e) => setForm({ ...form, instagram: e.target.value })}
      />
      <input
        placeholder="Timezone (e.g. America/New_York)"
        value={form.timezone}
        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
      />
      <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
        No-show fee (charged to the card on file)
      </label>
      <input
        placeholder="25.00"
        type="number"
        step="0.01"
        min="0"
        value={form.noShowFeeDollars}
        onChange={(e) => setForm({ ...form, noShowFeeDollars: e.target.value })}
      />
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && <p className="subtle" style={{ color: "#2e7d32" }}>Saved.</p>}
    </form>
  );
}
