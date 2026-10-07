"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, ChevronLeft } from "lucide-react";
import AdminBookingFlow from "@/components/AdminBookingFlow";
import { displayEmail } from "@/lib/placeholderEmail";

type Customer = { id: string; name: string; email: string; phone: string | null };

export default function NewBooking({
  businessSlug,
  services,
  stylists,
  overrides,
  customers,
  cardKeys,
  afterBookingHref,
}: {
  businessSlug: string;
  services: any[];
  stylists: any[];
  overrides: any[];
  customers: Customer[];
  cardKeys: Record<string, boolean>;
  afterBookingHref: string;
}) {
  const [picked, setPicked] = useState<Customer | null>(null);
  const [mode, setMode] = useState<"find" | "new">("find");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers.slice(0, 8);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(t) ||
          displayEmail(c.email).toLowerCase().includes(t) ||
          (c.phone ?? "").replace(/\D/g, "").includes(t.replace(/\D/g, "") || "\u0000")
      )
      .slice(0, 12);
  }, [q, customers]);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Couldn't add that customer — try again.");
      return;
    }
    setPicked(data);
  }

  if (picked) {
    // A brand-new customer has no card yet; existing ones are looked up per stylist.
    const cardByStylistId: Record<string, boolean> = {};
    for (const s of stylists) cardByStylistId[s.id] = !!cardKeys[`${picked.id}:${s.id}`];
    return (
      <div>
        <button className="back-link" onClick={() => setPicked(null)} style={{ marginBottom: 12 }}>
          <ChevronLeft size={16} /> Change customer
        </button>
        <div className="card static" style={{ marginBottom: 20 }}>
          <div className="avatar">{picked.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}</div>
          <div>
            <p className="name">{picked.name}</p>
            <p className="subtle" style={{ margin: "2px 0 0" }}>
              {[displayEmail(picked.email), picked.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <AdminBookingFlow
          businessSlug={businessSlug}
          services={services}
          stylists={stylists}
          overrides={overrides}
          customer={{ ...picked, email: picked.email }}
          cardByStylistId={cardByStylistId}
          afterBookingHref={afterBookingHref}
          allowSkipCard
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" className={mode === "find" ? "btn-primary" : "btn-ghost"} style={{ padding: "9px 16px", fontSize: 14 }} onClick={() => setMode("find")}>
          <Search size={14} style={{ verticalAlign: "-2px" }} /> Existing customer
        </button>
        <button type="button" className={mode === "new" ? "btn-primary" : "btn-ghost"} style={{ padding: "9px 16px", fontSize: 14 }} onClick={() => setMode("new")}>
          <UserPlus size={14} style={{ verticalAlign: "-2px" }} /> New customer
        </button>
      </div>

      {mode === "find" ? (
        <div>
          <div className="customer-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
            <input placeholder="Search by name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {matches.map((c) => (
              <button key={c.id} className="card" onClick={() => setPicked(c)}>
                <p className="name">{c.name}</p>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  {[displayEmail(c.email), c.phone].filter(Boolean).join(" · ")}
                </p>
              </button>
            ))}
            {matches.length === 0 && (
              <p className="subtle">
                No match. Use <strong>New customer</strong> to add them.
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={createCustomer} className="customer-form" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email (optional if you have a phone number)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <p className="subtle" style={{ fontSize: 12, margin: 0 }}>
            A phone number or an email is enough. With no email, they won&rsquo;t get email confirmations.
          </p>
          {error && <p style={{ color: "#b3261e", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving || !form.name.trim() || (!form.phone.trim() && !form.email.trim())}>
            {saving ? "Adding…" : "Continue to pick a time"}
          </button>
        </form>
      )}
    </div>
  );
}
