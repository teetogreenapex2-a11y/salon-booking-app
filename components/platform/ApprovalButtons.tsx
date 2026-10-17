"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject" | "pending") {
    setBusy(true);
    await fetch(`/api/platform/businesses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Permanently delete this salon, its owner login and ALL its data? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/platform/businesses/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      window.alert(d.error || "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {status !== "APPROVED" && (
        <button className="btn-primary" disabled={busy} onClick={() => act("approve")}>
          Approve
        </button>
      )}
      {status === "PENDING" && (
        <button className="btn-ghost" disabled={busy} onClick={() => act("reject")}>
          Reject
        </button>
      )}
      {status === "APPROVED" && (
        <button className="btn-ghost" disabled={busy} onClick={() => act("pending")}>
          Set back to pending
        </button>
      )}
      <button className="btn-ghost" disabled={busy} onClick={remove} style={{ color: "#b00020" }}>
        Delete
      </button>
    </div>
  );
}
