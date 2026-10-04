"use client";

import { useRef, useState } from "react";

type Photo = { id: string; url: string; caption: string | null };

export default function GalleryManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/admin/photos", { method: "POST", body: formData });
          const data = await res.json().catch(() => null);
          if (res.ok && data) {
            setPhotos((prev) => [...prev, data]);
          } else {
            setError(
              (data && data.error) ||
                `Couldn't upload "${file.name}" (server said ${res.status}) — try again.`
            );
          }
        } catch (err) {
          // Catches anything the branch above can't: a dropped connection,
          // the request failing before it even gets a response, etc. —
          // without this, that case showed nothing at all.
          console.error("[gallery] upload request failed:", err);
          setError(`Couldn't upload "${file.name}" — check your connection and try again.`);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <label
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: 20, cursor: "pointer" }}
      >
        {uploading ? "Uploading…" : "Add Photos"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </label>

      {error && (
        <p className="subtle" style={{ color: "#b00020", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="subtle">No photos yet — add some to show off your work.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid rgba(36,28,31,0.1)",
              }}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? ""}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                onClick={() => handleDelete(photo.id)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(36,28,31,0.7)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
                aria-label="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
