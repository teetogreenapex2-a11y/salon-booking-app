"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stylist = {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
};

export default function StylistManager({
  businessId,
  initialStylists,
}: {
  businessId: string;
  initialStylists: Stylist[];
}) {
  const router = useRouter();
  const [stylists, setStylists] = useState(initialStylists);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [saving, setSaving] = useState(false);

  async function addStylist(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/stylists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, name, specialty }),
    });
    const created = await res.json();
    setStylists((s) => [...s, created]);
    setName("");
    setSpecialty("");
    setSaving(false);
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/stylists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setStylists((list) => list.map((s) => (s.id === id ? { ...s, active: !active } : s)));
    router.refresh();
  }

  return (
    <div>
      <div className="list" style={{ marginBottom: 28 }}>
        {stylists.map((s) => (
          <div key={s.id} className="card static" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="name">
                {s.name}
                {!s.active && <span className="subtle"> (inactive)</span>}
              </p>
              {s.specialty && <p className="subtle" style={{ margin: "2px 0 0" }}>{s.specialty}</p>}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Link
                href={`/admin/stylists/${s.id}/pricing`}
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Edit pricing
              </Link>
              <button
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => toggleActive(s.id, s.active)}
              >
                {s.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
        {stylists.length === 0 && <p className="subtle">No stylists yet — add one below.</p>}
      </div>

      <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>
        Add a stylist
      </h2>
      <form
        onSubmit={addStylist}
        className="customer-form"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 360 }}
      >
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Specialty (optional)"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add stylist"}
        </button>
      </form>
    </div>
  );
}
