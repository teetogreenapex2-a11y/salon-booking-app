"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CampaignForm({ allCount, lapsedCount }: { allCount: number; lapsedCount: number }) {
  const router = useRouter();
  const [audience, setAudience] = useState<"ALL" | "LAPSED">("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const count = audience === "ALL" ? allCount : lapsedCount;

  async function post(test: boolean) {
    setMsg("");
    setBusy(true);
    const res = await fetch("/api/admin/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, audience, test }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Something went wrong.");
    if (test) return setMsg("Test sent to your email.");
    setMsg(`Sent to ${d.sent} customers.`);
    setSubject("");
    setBody("");
    router.refresh();
  }

  return (
    <div className="customer-form">
      <select value={audience} onChange={(e) => setAudience(e.target.value as "ALL" | "LAPSED")}>
        <option value="ALL">All customers ({allCount})</option>
        <option value="LAPSED">Haven't visited in 60+ days ({lapsedCount})</option>
      </select>
      <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
      <textarea
        placeholder={"Hi {name},\n\nWe have openings this week…"}
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <p className="subtle">{"{name}"} becomes each customer's first name. An unsubscribe link and your address are added automatically.</p>
      {msg && <p style={{ fontWeight: 500 }}>{msg}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-ghost" disabled={busy || !subject || !body} onClick={() => post(true)}>
          Send me a test
        </button>
        <button
          className="btn-primary"
          disabled={busy || !subject || !body || count === 0}
          onClick={() => {
            if (confirm(`Send this to ${count} customers?`)) post(false);
          }}
        >
          {busy ? "Sending…" : `Send to ${count}`}
        </button>
      </div>
    </div>
  );
}
