"use client";

import { useState } from "react";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert("Something went wrong starting checkout — try again.");
    }
  }

  return (
    <button className="btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "Subscribe"}
    </button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert("Something went wrong opening billing — try again.");
    }
  }

  return (
    <button className="btn-ghost" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "Manage billing"}
    </button>
  );
}
