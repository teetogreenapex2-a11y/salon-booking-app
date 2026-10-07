"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function StylistPhotoUpload({
  stylistId,
  name,
  photoUrl,
}: {
  stylistId: string;
  name: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(photoUrl);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/stylists/${stylistId}/photo`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUrl(data.photoUrl);
        router.refresh();
      } else {
        alert(data.error || "The photo didn't upload — try again.");
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setUrl(null);
    await fetch(`/api/admin/stylists/${stylistId}/photo`, { method: "DELETE" });
    router.refresh();
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div className="avatar" style={{ width: 52, height: 52, overflow: "hidden" }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          initials
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label className="btn-ghost" style={{ cursor: "pointer", padding: "6px 12px", fontSize: 12 }}>
          {busy ? "Uploading…" : url ? "Change photo" : "Add photo"}
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        </label>
        {url && (
          <button type="button" className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={remove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
