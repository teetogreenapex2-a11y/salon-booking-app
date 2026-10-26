"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type S = { id: string; name: string; depositsEnabled: boolean };

// On/off switches for deposits: one for the whole salon, one per stylist.
// Turning one off keeps the dollar amounts set on each service.
export default function DepositToggles({ salonEnabled, stylists }: { salonEnabled: boolean; stylists: S[] }) {
  const router = useRouter();
  const [salon, setSalon] = useState(salonEnabled);
  const [list, setList] = useState(stylists);

  async function save(url: string, value: boolean, undo: () => void) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositsEnabled: value }),
    });
    if (!res.ok) {
      undo();
      alert("Couldn't save — try again.");
      return;
    }
    router.refresh();
  }

  function toggleSalon() {
    const v = !salon;
    setSalon(v);
    save("/api/admin/business", v, () => setSalon(!v));
  }
  function toggleStylist(id: string) {
    const cur = list.find((s) => s.id === id)!.depositsEnabled;
    setList((l) => l.map((s) => (s.id === id ? { ...s, depositsEnabled: !cur } : s)));
    save(`/api/admin/stylists/${id}`, !cur, () =>
      setList((l) => l.map((s) => (s.id === id ? { ...s, depositsEnabled: cur } : s)))
    );
  }

  const row = { display: "flex", alignItems: "center", gap: 10, padding: "6px 0" } as const;

  return (
    <div className="card static" style={{ display: "block", marginBottom: 24, maxWidth: 520 }}>
      <label style={{ ...row, fontWeight: 600 }}>
        <input type="checkbox" checked={salon} onChange={toggleSalon} style={{ width: 18, height: 18 }} />
        Require deposits at booking (whole salon)
      </label>
      {salon && list.length > 1 && (
        <div style={{ marginLeft: 28, marginTop: 4 }}>
          <p className="subtle" style={{ fontSize: 12, margin: "0 0 4px" }}>Deposits apply to:</p>
          {list.map((s) => (
            <label key={s.id} style={row}>
              <input
                type="checkbox"
                checked={s.depositsEnabled}
                onChange={() => toggleStylist(s.id)}
                style={{ width: 16, height: 16 }}
              />
              {s.name}
            </label>
          ))}
        </div>
      )}
      {!salon && (
        <p className="subtle" style={{ fontSize: 12, margin: "4px 0 0 28px" }}>
          Off — nobody is asked for a deposit. Your amounts below are saved for when you turn it back on.
        </p>
      )}
    </div>
  );
}
