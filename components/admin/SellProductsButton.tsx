"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/admin/BarcodeScanner";

type Product = { id: string; barcode?: string | null; name: string; priceCents: number; stockQty: number };

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
  // "Card" charges the card on file; anything else records a payment taken outside the app.
  const [method, setMethod] = useState<string>("Card");

  const inStock = products.filter((p) => p.stockQty > 0);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  function handleScan(code: string) {
    const p = products.find((x) => x.barcode === code);
    if (!p) {
      setScanMsg(`No product with barcode ${code}. Add the barcode in Products.`);
      return;
    }
    if (p.stockQty <= 0) {
      setScanMsg(`${p.name} is out of stock.`);
      return;
    }
    setQty((q) => ({ ...q, [p.id]: String(Math.min(p.stockQty, Math.round(Number(q[p.id] || "0")) + 1)) }));
    setScanMsg(`Added ${p.name}`);
  }

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
      body: JSON.stringify({ items, method }),
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
      {scanning ? (
        <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />
      ) : (
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setScanning(true)}>
          Scan a product
        </button>
      )}
      {scanMsg && <p className="subtle" style={{ margin: 0, fontWeight: 600 }}>{scanMsg}</p>}
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
      <label className="subtle" style={{ fontSize: 12 }}>
        How are they paying?
      </label>
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        <option value="Card">Charge card on file</option>
        <option value="Venmo">Paid with Venmo</option>
        <option value="Cash App">Paid with Cash App</option>
        <option value="Zelle">Paid with Zelle</option>
        <option value="Cash">Paid with cash</option>
      </select>
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
          {submitting ? "Saving…" : method === "Card" ? `Charge $${(totalCents / 100).toFixed(2)}` : `Record $${(totalCents / 100).toFixed(2)} sale`}
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
