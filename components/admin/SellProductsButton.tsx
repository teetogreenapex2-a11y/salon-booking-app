"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; priceCents: number; stockQty: number };

export default function SellProductsButton({
  bookingId,
  products,
}: {
  bookingId: string;
  products: Product[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inStock = products.filter((p) => p.stockQty > 0);

  const totalCents = inStock.reduce((sum, p) => {
    const q = Math.round(Number(qty[p.id] || "0"));
    return sum + (q > 0 ? q * p.priceCents : 0);
  }, 0);

  async function submit() {
    const items = inStock
      .map((p) => ({ productId: p.id, quantity: Math.round(Number(qty[p.id] || "0")) }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) return;

    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/admin/bookings/${bookingId}/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      setQty({});
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't charge the card.");
    }
  }

  if (!open) {
    return (
      <button
        className="btn-ghost"
        style={{ padding: "6px 12px", fontSize: 12 }}
        onClick={() => setOpen(true)}
        disabled={inStock.length === 0}
      >
        Sell products
      </button>
    );
  }

  return (
    <div
      className="card static"
      style={{
        flexDirection: "column",
        alignItems: "stretch",
        gap: 8,
        minWidth: 240,
        padding: 12,
      }}
    >
      {inStock.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: 13 }}>
            {p.name} <span className="subtle">(${(p.priceCents / 100).toFixed(2)})</span>
          </span>
          <input
            type="number"
            min={0}
            max={p.stockQty}
            placeholder="0"
            value={qty[p.id] ?? ""}
            onChange={(e) => setQty((q) => ({ ...q, [p.id]: e.target.value }))}
            style={{ width: 56 }}
          />
        </div>
      ))}
      <p className="name" style={{ margin: "4px 0 0" }}>
        Total: ${(totalCents / 100).toFixed(2)}
      </p>
      {error && (
        <p className="subtle" style={{ color: "#b00020", margin: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-primary"
          style={{ padding: "6px 12px", fontSize: 12 }}
          onClick={submit}
          disabled={submitting || totalCents === 0}
        >
          {submitting ? "Charging…" : `Charge $${(totalCents / 100).toFixed(2)}`}
        </button>
        <button
          className="btn-ghost"
          style={{ padding: "6px 12px", fontSize: 12 }}
          onClick={() => {
            setOpen(false);
            setQty({});
            setError("");
          }}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
