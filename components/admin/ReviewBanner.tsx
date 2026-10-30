"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Shown to quick-start salons until they confirm the starter menu.
export default function ReviewBanner() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    const res = await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicesReviewed: true }),
    });
    setSaving(false);
    if (!res.ok) {
      alert("Couldn't save — try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="card static" style={{ display: "block", marginBottom: 20, maxWidth: 520, borderColor: "var(--berry)" }}>
      <p className="name" style={{ margin: "0 0 4px" }}>We started you with a typical menu</p>
      <p className="subtle" style={{ margin: "0 0 12px", fontSize: 13 }}>
        Change any price or time below, hide what you don&rsquo;t offer, then tap the button.
      </p>
      <button className="btn-primary" style={{ padding: "10px 18px" }} onClick={confirm} disabled={saving}>
        {saving ? "Saving…" : "Looks good"}
      </button>
    </div>
  );
}
