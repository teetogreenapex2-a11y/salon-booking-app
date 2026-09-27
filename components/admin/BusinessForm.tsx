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
};

export default function BusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState(business);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && <p className="subtle" style={{ color: "#2e7d32" }}>Saved.</p>}
    </form>
  );
}
