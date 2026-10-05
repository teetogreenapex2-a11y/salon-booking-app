"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StylistPaymentOptions({
  venmoHandle,
  cashAppHandle,
  zelleInfo,
}: {
  venmoHandle: string | null;
  cashAppHandle: string | null;
  zelleInfo: string | null;
}) {
  const router = useRouter();
  const [venmo, setVenmo] = useState(venmoHandle ?? "");
  const [cashApp, setCashApp] = useState(cashAppHandle ?? "");
  const [zelle, setZelle] = useState(zelleInfo ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/stylist/payment-options", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venmoHandle: venmo, cashAppHandle: cashApp, zelleInfo: zelle }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setVenmo(data.venmoHandle ?? "");
      setCashApp(data.cashAppHandle ?? "");
      setZelle(data.zelleInfo ?? "");
      setMessage({ text: "Saved.", error: false });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ text: data.error || "Couldn't save that — try again.", error: true });
    }
  }

  const row = { display: "flex", alignItems: "center", gap: 8 } as const;

  return (
    <div className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, marginBottom: 28 }}>
      <p className="name" style={{ margin: 0 }}>My payment options</p>
      <p className="subtle" style={{ margin: 0, fontSize: 12 }}>
        Optional. Customers who&rsquo;d rather pay you with Venmo, Cash App or Zelle will see a pay
        link in their booking confirmation. Hairsalonix never handles this money.
      </p>
      <div style={row}>
        <label className="subtle" style={{ fontSize: 12, width: 70 }}>Venmo</label>
        <input placeholder="username (no @)" value={venmo} onChange={(e) => setVenmo(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
      </div>
      <div style={row}>
        <label className="subtle" style={{ fontSize: 12, width: 70 }}>Cash App</label>
        <input placeholder="$cashtag (no $)" value={cashApp} onChange={(e) => setCashApp(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
      </div>
      <div style={row}>
        <label className="subtle" style={{ fontSize: 12, width: 70 }}>Zelle</label>
        <input placeholder="phone or email" value={zelle} onChange={(e) => setZelle(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save payment options"}
        </button>
        {message && (
          <span className="subtle" style={{ fontSize: 12, color: message.error ? "#b00020" : undefined }}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
