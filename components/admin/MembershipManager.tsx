"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function call(url: string, method: string, body: object) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) alert(d.error || "Something went wrong.");
  return res.ok;
}

export function NewPlanForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", price: "", discountPct: "" });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="customer-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (await call("/api/admin/membership-plans", "POST", f)) {
          setF({ name: "", price: "", discountPct: "" });
          router.refresh();
        }
        setBusy(false);
      }}
    >
      <input placeholder="Plan name (e.g. VIP)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      <input placeholder="Price per month ($)" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
      <input placeholder="Discount on services (%)" inputMode="numeric" value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: e.target.value })} required />
      <button className="btn-primary" disabled={busy}>Add plan</button>
    </form>
  );
}

export function PlanToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        if (await call(`/api/admin/membership-plans/${id}`, "PATCH", { active: !active })) router.refresh();
      }}
    >
      {active ? "Retire" : "Bring back"}
    </button>
  );
}

export function AddMemberForm({
  customers,
  plans,
}: {
  customers: { id: string; name: string }[];
  plans: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="customer-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (await call("/api/admin/memberships", "POST", { customerId, planId })) {
          setCustomerId("");
          router.refresh();
        }
        setBusy(false);
      }}
    >
      <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
        <option value="">Choose a customer…</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select value={planId} onChange={(e) => setPlanId(e.target.value)} required>
        <option value="">Choose a plan…</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button className="btn-primary" disabled={busy}>Sign up (paid for 1 month)</button>
    </form>
  );
}

export function MemberActions({ id }: { id: string }) {
  const router = useRouter();
  const act = async (action: string) => {
    if (action === "cancel" && !confirm("Cancel this membership?")) return;
    if (await call(`/api/admin/memberships/${id}`, "PATCH", { action })) router.refresh();
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="btn-primary" onClick={() => act("renew")}>Record payment (+1 month)</button>
      <button className="btn-ghost" onClick={() => act("cancel")}>Cancel</button>
    </div>
  );
}
