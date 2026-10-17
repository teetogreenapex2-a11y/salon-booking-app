"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/admin/BarcodeScanner";

type Product = {
  id: string;
  name: string;
  barcode?: string | null;
  priceCents: number;
  costCents: number;
  lowStockAt: number;
  stockQty: number;
  active: boolean;
};

const $ = (c: number) => `$${(c / 100).toFixed(2)}`;

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
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("10");
  const [lowAt, setLowAt] = useState("3");
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState("");

  // Scanner: "stock" adds 1 per scan, "count" tallies a shelf count to apply.
  const [scanMode, setScanMode] = useState<null | "stock" | "count">(null);
  const [scanMsg, setScanMsg] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const productsRef = useRef(products);
  productsRef.current = products;
  const formRef = useRef<HTMLFormElement>(null);

  // Per-row draft restock amount, keyed by product id.
  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState<string | null>(null);

  // Per-row price / cost editing.
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editLow, setEditLow] = useState("");
  const [editCode, setEditCode] = useState("");

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
        costCents: Math.round(Number(cost || "0") * 100),
        stockQty: Number(stock) || 0,
        lowStockAt: Number(lowAt) || 0,
        barcode,
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
    setCost("");
    setStock("10");
    setLowAt("3");
    setBarcode("");
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
      body: JSON.stringify({ stockQty: Math.max(0, currentStock + amount) }),
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

  function startEdit(p: Product) {
    setEditing(p.id);
    setEditPrice((p.priceCents / 100).toFixed(2));
    setEditCost((p.costCents / 100).toFixed(2));
    setEditLow(String(p.lowStockAt));
    setEditCode(p.barcode || "");
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceCents: Math.round(Number(editPrice) * 100),
        costCents: Math.round(Number(editCost || "0") * 100),
        lowStockAt: Math.round(Number(editLow || "0")),
        barcode: editCode,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Couldn't save — try again.");
      return;
    }
    const updated = await res.json();
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    setEditing(null);
    router.refresh();
  }

  async function handleScan(code: string) {
    const p = productsRef.current.find((x) => x.barcode === code);
    if (!p) {
      setBarcode(code);
      setScanMsg(`New barcode ${code} — type its name and price in "Add a product" below.`);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (scanMode === "count") {
      setCounts((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
      setScanMsg(`Counted ${p.name}`);
      return;
    }
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty: p.stockQty + 1 }),
    });
    if (!res.ok) {
      setScanMsg("Couldn't update stock — try again.");
      return;
    }
    const updated = await res.json();
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, stockQty: updated.stockQty } : x)));
    setScanMsg(`+1 ${p.name} (now ${updated.stockQty})`);
  }

  async function applyCounts() {
    const list = Object.entries(counts).map(([productId, qty]) => ({ productId, qty }));
    if (list.length === 0) return;
    const res = await fetch("/api/admin/stock/count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counts: list }),
    });
    if (!res.ok) {
      alert("Couldn't save the count — try again.");
      return;
    }
    setProducts((l) => l.map((x) => (counts[x.id] !== undefined ? { ...x, stockQty: counts[x.id] } : x)));
    setCounts({});
    setScanMode(null);
    setScanMsg("");
    router.refresh();
  }

  const lowCount = products.filter((p) => p.active && p.stockQty <= p.lowStockAt).length;

  return (
    <div>
      {lowCount > 0 && (
        <p style={{ color: "#b3261e", fontWeight: 600, marginBottom: 12 }}>
          {lowCount} product{lowCount === 1 ? " is" : "s are"} low or out of stock.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setScanMode("stock"); setScanMsg(""); }}>
          Scan to add stock
        </button>
        <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setScanMode("count"); setScanMsg(""); setCounts({}); }}>
          Count shelf
        </button>
        <a className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} href="/admin/labels">
          Print QR labels
        </a>
      </div>
      {scanMode && (
        <div style={{ marginBottom: 16 }}>
          <p className="subtle" style={{ margin: "0 0 6px" }}>
            {scanMode === "stock"
              ? "Each scan adds 1 to that product's stock."
              : "Scan every item on the shelf (once per item), then tap Apply to set stock to your count."}
          </p>
          <BarcodeScanner onScan={handleScan} onClose={() => { setScanMode(null); setScanMsg(""); }} />
          {scanMsg && <p style={{ fontWeight: 600, margin: "8px 0 0" }}>{scanMsg}</p>}
          {scanMode === "count" && Object.keys(counts).length > 0 && (
            <div style={{ marginTop: 8 }}>
              {Object.entries(counts).map(([id, n]) => (
                <p key={id} className="subtle" style={{ margin: "2px 0" }}>
                  {products.find((x) => x.id === id)?.name}: {n}
                </p>
              ))}
              <button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12, marginTop: 6 }} onClick={applyCounts}>
                Apply counts
              </button>
            </div>
          )}
        </div>
      )}
      <div className="list" style={{ marginBottom: 28 }}>
        {products.map((p) => {
          const margin = p.priceCents - p.costCents;
          const low = p.stockQty <= p.lowStockAt;
          return (
            <div key={p.id} className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <p className="name">
                    {p.name}
                    {!p.active && <span className="subtle"> (inactive)</span>}
                  </p>
                  <p className="subtle" style={{ margin: "2px 0 0" }}>
                    Sells {$(p.priceCents)}
                    {p.costCents > 0 && ` · cost ${$(p.costCents)} · profit ${$(margin)} each`}
                    {" · "}
                    <span style={{ color: low ? "#b3261e" : undefined, fontWeight: low ? 600 : undefined }}>
                      {p.stockQty === 0 ? "Out of stock" : `${p.stockQty} in stock${low ? " (low)" : ""}`}
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() => toggleActive(p.id, p.active)}
                  >
                    {p.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>

              {editing === p.id && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(36,28,31,0.08)" }}>
                  <label className="subtle" style={{ fontSize: 12 }}>Price $</label>
                  <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: 80 }} />
                  <label className="subtle" style={{ fontSize: 12 }}>You pay $</label>
                  <input type="number" step="0.01" value={editCost} onChange={(e) => setEditCost(e.target.value)} style={{ width: 80 }} />
                  <label className="subtle" style={{ fontSize: 12 }}>Barcode</label>
                  <input value={editCode} onChange={(e) => setEditCode(e.target.value)} style={{ width: 140 }} placeholder="scan or type" />
                  <label className="subtle" style={{ fontSize: 12 }}>Warn at</label>
                  <input type="number" value={editLow} onChange={(e) => setEditLow(e.target.value)} style={{ width: 60 }} />
                  <button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => saveEdit(p.id)}>
                    Save
                  </button>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              )}

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
          );
        })}
        {products.length === 0 && <p className="subtle">No products yet — add one below.</p>}
      </div>

      <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>
        Add a product
      </h2>
      <form
        ref={formRef}
        onSubmit={addProduct}
        className="customer-form"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none", maxWidth: 360 }}
      >
        <label className="subtle" style={{ fontSize: 12 }}>Name</label>
        <input placeholder="e.g. Shampoo" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Price you sell it for (dollars)</label>
        <input placeholder="20.00" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>What you pay for it (dollars, for profit reports)</label>
        <input placeholder="9.00" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Starting stock (how many you have on hand)</label>
        <input placeholder="10" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Warn me when stock is this low</label>
        <input placeholder="3" type="number" value={lowAt} onChange={(e) => setLowAt(e.target.value)} />

        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>Barcode (optional — scan it with "Scan to add stock", or leave blank)</label>
        <input placeholder="Scan or type" value={barcode} onChange={(e) => setBarcode(e.target.value)} />

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>
    </div>
  );
}
