"use client";

import { useState } from "react";

export default function JoinSalonForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/join-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setDone(data.salon || "the salon");
    else setError(data.error || "Something went wrong — try again.");
  }

  if (done) {
    return (
      <p style={{ fontWeight: 500 }}>
        Request sent to {done}. Once the owner approves you, sign in again and you'll land in your stylist dashboard.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="customer-form">
      <input placeholder="Your name (shown to clients)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        placeholder="Salon's web address (hairsalonix.com/…)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
      />
      {error && <p style={{ color: "#a33" }}>{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Ask to join"}
      </button>
    </form>
  );
}
