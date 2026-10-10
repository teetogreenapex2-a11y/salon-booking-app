"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IssueGiftCardForm() {
  const router = useRouter();
  const [f, setF] = useState({ amount: "", recipientName: "", recipientEmail: "", purchaserName: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Something went wrong.");
    setMsg(`Gift card created: ${d.code}`);
    setF({ amount: "", recipientName: "", recipientEmail: "", purchaserName: "", note: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="customer-form">
      <input placeholder="Amount ($)" inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} required />
      <input placeholder="Who it's for (optional)" value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
      <input placeholder="Email the code to them (optional)" type="email" value={f.recipientEmail} onChange={(e) => set("recipientEmail", e.target.value)} />
      <input placeholder="From (optional)" value={f.purchaserName} onChange={(e) => set("purchaserName", e.target.value)} />
      <input placeholder="Message (optional)" value={f.note} onChange={(e) => set("note", e.target.value)} />
      {msg && <p style={{ fontWeight: 600 }}>{msg}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Creating…" : "Create gift card"}</button>
    </form>
  );
}

export function VoidGiftCardButton({ id, voided }: { id: string; voided: boolean }) {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        if (!voided && !confirm("Void this gift card? It can't be used until restored.")) return;
        await fetch(`/api/admin/gift-cards/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voided: !voided }),
        });
        router.refresh();
      }}
    >
      {voided ? "Restore" : "Void"}
    </button>
  );
}
