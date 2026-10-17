"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_CATALOG, MAX_TABS } from "@/lib/navTabs";

const label = (k: string) => NAV_CATALOG.find((c) => c.key === k)?.label ?? k;

export default function NavTabsEditor({ initialTabs }: { initialTabs: string[] }) {
  const router = useRouter();
  const [tabs, setTabs] = useState(initialTabs);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const available = NAV_CATALOG.filter((c) => !tabs.includes(c.key));

  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= tabs.length) return;
    const t = [...tabs];
    [t[i], t[j]] = [t[j], t[i]];
    setTabs(t);
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/nav-tabs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabs }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Saved.");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Couldn't save.");
    }
  }

  const small = { padding: "4px 10px", fontSize: 12 } as const;

  return (
    <section style={{ marginTop: 36, maxWidth: 420 }}>
      <h2 className="display" style={{ fontSize: 20, marginBottom: 4 }}>Phone menu</h2>
      <p className="subtle" style={{ marginBottom: 12 }}>
        Pick up to {MAX_TABS} pages for the bar at the bottom of your phone. Everything else goes under More.
      </p>

      <div className="list" style={{ marginBottom: 12 }}>
        {tabs.map((k, i) => (
          <div key={k} className="card static" style={{ padding: "8px 12px", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1 }}>{label(k)}</span>
            <button className="btn-ghost" style={small} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${label(k)} up`}>↑</button>
            <button className="btn-ghost" style={small} onClick={() => move(i, 1)} disabled={i === tabs.length - 1} aria-label={`Move ${label(k)} down`}>↓</button>
            <button className="btn-ghost" style={small} onClick={() => setTabs(tabs.filter((x) => x !== k))} disabled={tabs.length <= 1}>
              Remove
            </button>
          </div>
        ))}
      </div>

      {tabs.length < MAX_TABS && (
        <div style={{ marginBottom: 12 }}>
          <p className="subtle" style={{ margin: "0 0 6px", fontSize: 12 }}>Add a page:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {available.map((c) => (
              <button key={c.key} className="btn-ghost" style={small} onClick={() => setTabs([...tabs, c.key])}>
                + {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="subtle" style={{ fontSize: 12, margin: "0 0 10px" }}>
        Bar: {tabs.map(label).join(" · ")} · More
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save menu"}
        </button>
        <button className="btn-ghost" style={small} onClick={() => setTabs(["dashboard", "calendar", "bookings", "customers"])}>
          Reset
        </button>
        {msg && <span className="subtle">{msg}</span>}
      </div>
    </section>
  );
}
