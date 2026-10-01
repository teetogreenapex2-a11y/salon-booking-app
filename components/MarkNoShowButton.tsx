"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkNoShowButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Mark this booking as a no-show?")) return;
    setLoading(true);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "NO_SHOW" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className="btn-ghost"
      style={{ padding: "6px 12px", fontSize: 12 }}
      onClick={handleClick}
      disabled={loading}
    >
      No-show
    </button>
  );
}
