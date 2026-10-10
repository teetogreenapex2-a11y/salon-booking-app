"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENT_PRESETS, DEFAULT_ACCENT } from "@/lib/accent";

type Business = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  address: string | null;
  instagram: string | null;
  timezone: string;
  noShowFeeCents: number;
  cancelCutoffHours: number;
  listed: boolean;
  reviewUrl: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  coverUrl: string | null;
};

export default function BusinessForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...business,
    noShowFeeDollars: (business.noShowFeeCents / 100).toFixed(2),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [accent, setAccent] = useState(business.accentColor ?? DEFAULT_ACCENT);
  const [coverUrl, setCoverUrl] = useState(business.coverUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/business/cover", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCoverUrl(data.coverUrl);
        router.refresh();
      } else {
        alert(data.error || "The photo didn't upload — try again.");
      }
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleCoverRemove() {
    setCoverUrl(null);
    await fetch("/api/admin/business/cover", { method: "DELETE" });
    router.refresh();
  }
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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "The logo didn't upload — try again.");
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
        slug: form.slug,
        tagline: form.tagline,
        address: form.address,
        instagram: form.instagram,
        timezone: form.timezone,
        noShowFeeCents,
        listed: form.listed,
        reviewUrl: form.reviewUrl ?? "",
        cancelCutoffHours: Math.max(0, Math.round(Number(form.cancelCutoffHours) || 0)),
        accentColor: accent,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setForm((f) => ({ ...f, slug: updated.slug }));
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save — try signing in again and retrying.");
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

      <div style={{ marginBottom: 24 }}>
        <label className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          Cover photo (top of your booking page)
        </label>
        <div
          style={{
            height: 110,
            borderRadius: 14,
            overflow: "hidden",
            background: coverUrl ? `center / cover no-repeat url(${coverUrl})` : "var(--blush)",
            marginBottom: 10,
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <label className="btn-primary" style={{ cursor: "pointer", fontSize: 13, padding: "9px 16px" }}>
            {uploadingCover ? "Uploading…" : coverUrl ? "Replace" : "Upload cover photo"}
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
          </label>
          {coverUrl && (
            <button type="button" onClick={handleCoverRemove} className="icon-btn" style={{ padding: "9px 14px", fontSize: 13 }}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="subtle" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          Your color (used on your booking page — save changes below to apply)
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              aria-label={c.name}
              onClick={() => setAccent(c.hex)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: c.hex,
                border: accent === c.hex ? "3px solid #fff" : "3px solid transparent",
                boxShadow: accent === c.hex ? `0 0 0 2px ${c.hex}` : "0 1px 3px rgba(0,0,0,0.25)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            aria-label="Custom color"
            style={{ width: 40, height: 34, padding: 0, border: "none", background: "none" }}
          />
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
        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          Booking web address
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className="subtle" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
            hairsalonix.com/
          </span>
          <input
            placeholder="studio-fern"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        <p className="subtle" style={{ fontSize: 12, margin: "-4px 0 4px" }}>
          Changing this changes your booking link — any link you&rsquo;ve already shared or printed
          with the old address will stop working.
        </p>
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
        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          Customers can reschedule or cancel on their own up to this many hours before the appointment
        </label>
        <input
          placeholder="24"
          type="number"
          step="1"
          min="0"
          value={form.cancelCutoffHours}
          onChange={(e) => setForm({ ...form, cancelCutoffHours: Number(e.target.value) })}
        />
        <label className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
          Google review link (optional) — customers get one email after their visit asking for a review. Leave blank to turn this off.
        </label>
        <input
          placeholder="https://g.page/r/your-salon/review"
          type="url"
          value={form.reviewUrl ?? ""}
          onChange={(e) => setForm({ ...form, reviewUrl: e.target.value })}
        />
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.listed}
            onChange={(e) => setForm({ ...form, listed: e.target.checked })}
            style={{ marginTop: 3, width: "auto" }}
          />
          <span>
            List my salon on Hairsalonix&rsquo;s &ldquo;Find a salon&rdquo; page and in Google search.
            <span className="subtle" style={{ display: "block", fontSize: 12 }}>
              Turn off to keep your page private — anyone with your booking link can still book.
            </span>
          </span>
        </label>
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <p className="subtle" style={{ color: "#2e7d32" }}>Saved.</p>}
        {error && (
          <p className="subtle" style={{ color: "#c62828" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
