"use client";

import { useState } from "react";

export default function UnsubscribeButton({ customerId, sig }: { customerId: string; sig: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) return <p style={{ fontWeight: 500 }}>You're unsubscribed. You'll still get messages about your own appointments.</p>;
  return (
    <button
      className="btn-primary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, sig }),
        });
        setBusy(false);
        if (res.ok) setDone(true);
        else alert("That link isn't valid.");
      }}
    >
      {busy ? "Working…" : "Unsubscribe"}
    </button>
  );
}
