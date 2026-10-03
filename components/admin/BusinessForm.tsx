"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  tagline: string | null;
  address: string | null;
  instagram: string | null;
  timezone: string;
  noShowFeeCents: number;
  logoUrl: string | null;
};

export default function BusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...business,
    noShowFeeDollars: (business.noShowFeeCents / 100).toFixed(2),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/business/logo", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl);
        router.refresh();
      }
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    setLogoUrl(null);
    await fetch("/api/admin/business/logo", { method: "DELETE" });
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(false);

    const noShowFeeCents = Math.round(parseFloat(form.noShowFeeDollars || "0") * 100) || 0;

    const res = await fetch("/api/admin/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        tagline: form.tagline,
        address: form.address,
        instagram: form.instagram,
        timezone: form.timezone,
        noShowFeeCents,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ marginBottom: 24 }}>
        <label className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          Logo
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--blush)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="subtle" style={{ fontSize: 11 }}>
                No logo
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <label className="btn-primary" style={{ cursor: "pointer", fontSize: 13, padding: "9px 16px" }}>
              {uploadingLogo ? "Uploading…" : logoUrl ? "Replace" : "Upload logo"}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: "none" }}
              />
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={handleLogoRemove}
                className="icon-btn"
                style={{ padding: "9px 14px", fontSize: 13 }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="customer-form"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <input
          placeholder="Salon name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Tagline"
          value={form.tagline ?? ""}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
        />
        <input
          placeholder="Address"
          value={form.address ?? ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          placeholder="Instagram handle"
          value={form.instagram ?? ""}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
        />
        <input
          placeholder="Timezone (e.g. America/New_York)"
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
        />
        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          No-show fee (charged to the card on file)
        </label>
        <input
          placeholder="25.00"
          type="number"
          step="0.01"
          min="0"
          value={form.noShowFeeDollars}
          onChange={(e) => setForm({ ...form, noShowFeeDollars: e.target.value })}
        />
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <p className="subtle" style={{ color: "#2e7d32" }}>Saved.</p>}
        {error && (
          <p className="subtle" style={{ color: "#c62828" }}>
            Couldn&rsquo;t save — try signing in again and retrying.
          </p>
        )}
      </form>
    </div>
  );
}
