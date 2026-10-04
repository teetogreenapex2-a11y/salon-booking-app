"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  stockQty: number;
  active: boolean;
};

export default function ProductManager({
  businessId,
  initialProducts,
}: {
  businessId: string;
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("20");
  const [stock, setStock] = useState("10");
  const [saving, setSaving] = useState(false);

  // Per-row draft restock amount, keyed by product id — lets each row's
  // "Add stock" box be used independently.
  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState<string | null>(null);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        name,
        priceCents: Math.round(Number(price) * 100),
        stockQty: Number(stock) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Couldn't add product — try signing in again and retrying.");
      return;
    }
    const created = await res.json();
    setProducts((p) => [...p, created]);
    setName("");
    setPrice("20");
    setStock("10");
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, active: !active } : p)));
    router.refresh();
  }

  async function addStock(id: string, currentStock: number) {
    const amount = Math.round(Number(restockDrafts[id] || "0"));
    if (!amount) return;
    setRestocking(id);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty: currentStock + amount }),
    });
    setRestocking(null);
    if (!res.ok) {
      alert("Couldn't update stock — try again.");
      return;
    }
    const updated = await res.json();
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, stockQty: updated.stockQty } : p)));
    setRestockDrafts((d) => ({ ...d, [id]: "" }));
    router.refresh();
  }

  return (
    <div>
      <div className="list" style={{ marginBottom: 28 }}>
        {products.map((p) => (
          <div key={p.id} className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="name">
                  {p.name}
                  {!p.active && <span className="subtle"> (inactive)</span>}
                </p>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  ${(p.priceCents / 100).toFixed(2)} ·{" "}
                  <span style={{ color: p.stockQty === 0 ? "#b3261e" : undefined }}>
                    {p.stockQty} in stock
                  </span>
                </p>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => toggleActive(p.id, p.active)}
              >
                {p.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid rgba(36,28,31,0.08)",
              }}
            >
              <label className="subtle" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                Add stock
              </label>
              <input
                type="number"
                placeholder="0"
                value={restockDrafts[p.id] ?? ""}
                onChange={(e) => setRestockDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                style={{ width: 80 }}
              />
              <button
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => addStock(p.id, p.stockQty)}
                disabled={restocking === p.id}
              >
                {restocking === p.id ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="subtle">No products yet — add one below.</p>}
      </div>

      <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>
        Add a product
      </h2>
      <form
        onSubmit={addProduct}
        className="customer-form"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 360 }}
      >
        <label className="subtle" style={{ fontSize: 12 }}>
          Name
        </label>
        <input placeholder="e.g. Shampoo" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          Price (dollars)
        </label>
        <input
          placeholder="20.00"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          Starting stock (how many you have on hand)
        </label>
        <input
          placeholder="10"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>
    </div>
  );
}
