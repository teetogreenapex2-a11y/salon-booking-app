"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelBookingButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    setLoading(true);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className="btn-ghost"
      style={{ padding: "6px 12px", fontSize: 12 }}
      onClick={handleCancel}
      disabled={loading}
    >
      Cancel
    </button>
  );
}
