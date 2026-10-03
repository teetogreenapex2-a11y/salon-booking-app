"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stylist = {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
  email: string | null;
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

  // Per-row draft email text and save state, keyed by stylist id — lets
  // each row's "Set login" box be edited independently.
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialStylists.map((s) => [s.id, s.email ?? ""]))
  );
  const [emailSaving, setEmailSaving] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<Record<string, string>>({});

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
    setEmailDrafts((d) => ({ ...d, [created.id]: created.email ?? "" }));
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

  async function saveEmail(id: string) {
    setEmailSaving(id);
    setEmailError((e) => ({ ...e, [id]: "" }));
    const email = emailDrafts[id]?.trim() || null;

    const res = await fetch(`/api/admin/stylists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const updated = await res.json();
      setStylists((list) => list.map((s) => (s.id === id ? { ...s, email: updated.email } : s)));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setEmailError((e) => ({
        ...e,
        [id]: data.error || "Couldn't save that email.",
      }));
    }
    setEmailSaving(null);
  }

  return (
    <div>
      <div className="list" style={{ marginBottom: 28 }}>
        {stylists.map((s) => (
          <div key={s.id} className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid rgba(36,28,31,0.08)",
              }}
            >
              <label className="subtle" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                Login email
              </label>
              <input
                type="email"
                placeholder="stylist@example.com"
                value={emailDrafts[s.id] ?? ""}
                onChange={(e) => setEmailDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                onClick={() => saveEmail(s.id)}
                disabled={emailSaving === s.id}
              >
                {emailSaving === s.id ? "Saving…" : "Save"}
              </button>
            </div>
            {emailError[s.id] && (
              <p className="subtle" style={{ color: "#b00020", margin: 0 }}>
                {emailError[s.id]}
              </p>
            )}
            {s.email && (
              <p className="subtle" style={{ margin: 0, fontSize: 12 }}>
                {s.name.split(" ")[0]} signs in at hairsalonix.com/login with this email — they&rsquo;ll
                see their own calendar, reports, and hours only.
              </p>
            )}
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
