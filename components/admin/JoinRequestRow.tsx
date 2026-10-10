"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRequestRow({ id, name, email }: { id: string; name: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "decline") {
    setBusy(true);
    const res = await fetch(`/api/join-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Something went wrong.");
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <div>
        <strong>{name}</strong>
        <div className="subtle">{email}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" disabled={busy} onClick={() => act("approve")}>Approve</button>
        <button className="btn-ghost" disabled={busy} onClick={() => act("decline")}>Decline</button>
      </div>
    </div>
  );
}
