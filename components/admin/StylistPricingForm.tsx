"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = { id: string; name: string; durationMin: number; priceCents: number };
type Override = { serviceId: string; priceCents: number | null; durationMin: number | null };

type Row = { serviceId: string; price: string; duration: string; offered: boolean };

export default function StylistPricingForm({
  stylistId,
  services,
  overrides,
}: {
  stylistId: string;
  services: Service[];
  overrides: Override[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() =>
    services.map((s) => {
      const o = overrides.find((o) => o.serviceId === s.id);
      // A saved override of exactly $0 means "I don't do this service" —
      // see the server-side check in lib/pricing.ts. Any other saved
      // price, or no override at all, means it's offered.
      const offered = o?.priceCents !== 0;
      return {
        serviceId: s.id,
        price: offered && o?.priceCents != null ? (o.priceCents / 100).toString() : "",
        duration: offered && o?.durationMin != null ? o.durationMin.toString() : "",
        offered,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateRow(serviceId: string, field: "price" | "duration", value: string) {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.serviceId === serviceId ? { ...r, [field]: value } : r)));
  }

  function toggleOffered(serviceId: string, offered: boolean) {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.serviceId === serviceId ? { ...r, offered } : r)));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const payload = rows.map((r) =>
      r.offered
        ? {
            serviceId: r.serviceId,
            priceCents: r.price.trim() === "" ? null : Math.round(Number(r.price) * 100),
            durationMin: r.duration.trim() === "" ? null : Number(r.duration),
          }
        : // $0 is how "I don't do this service" is stored — see lib/pricing.ts.
          { serviceId: r.serviceId, priceCents: 0, durationMin: null }
    );

    await fetch(`/api/admin/stylists/${stylistId}/pricing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: payload }),
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="list" style={{ marginBottom: 20 }}>
        {services.map((s) => {
          const row = rows.find((r) => r.serviceId === s.id)!;
          return (
            <div key={s.id} className="card static" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <p className="name">{s.name}</p>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={!row.offered}
                    onChange={(e) => toggleOffered(s.id, !e.target.checked)}
                  />
                  I don&rsquo;t do this service
                </label>
              </div>
              {row.offered ? (
                <>
                  <p className="subtle" style={{ fontSize: 12, margin: 0 }}>
                    Standard: ${(s.priceCents / 100).toFixed(0)} · {s.durationMin} min
                  </p>
                  <div className="row" style={{ gap: 12 }}>
                    <label style={{ flex: 1 }}>
                      <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                        This stylist&rsquo;s price ($)
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder={`${(s.priceCents / 100).toFixed(0)}`}
                        value={row.price}
                        onChange={(e) => updateRow(s.id, "price", e.target.value)}
                      />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                        This stylist&rsquo;s duration (min)
                      </span>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        placeholder={`${s.durationMin}`}
                        value={row.duration}
                        onChange={(e) => updateRow(s.id, "duration", e.target.value)}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <p className="subtle" style={{ fontSize: 12, margin: 0 }}>
                  Hidden from customers booking with this stylist.
                </p>
              )}
            </div>
          );
        })}
        {services.length === 0 && <p className="subtle">No services yet — add some under Services first.</p>}
      </div>

      <button className="btn-primary" onClick={save} disabled={saving || services.length === 0}>
        {saving ? "Saving…" : "Save pricing"}
      </button>
      {saved && (
        <span className="subtle" style={{ marginLeft: 12 }}>
          Saved.
        </span>
      )}
    </div>
  );
}
