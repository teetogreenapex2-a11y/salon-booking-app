"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChargeNoShowFeeButton({ id, feeCents }: { id: string; feeCents: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(`Charge the $${(feeCents / 100).toFixed(2)} no-show fee to the card on file?`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/bookings/${id}/charge-no-show`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Couldn't charge the fee.");
    }
  }

  return (
    <button
      className="btn-primary"
      style={{ padding: "6px 12px", fontSize: 12 }}
      onClick={handleClick}
      disabled={loading}
    >
      Charge fee
    </button>
  );
}
