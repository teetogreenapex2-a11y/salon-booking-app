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

export function ConnectButton({ alreadyConnected }: { alreadyConnected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "Something went wrong — try again.");
    } catch {
      alert("Couldn't reach the server — try again.");
    }
    setLoading(false);
  }

  return (
    <button className="btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : alreadyConnected ? "Finish/update payment setup" : "Connect Stripe to accept payments"}
    </button>
  );
}

// Booth-renter versions of the three buttons above — same ideas, just
// hitting the /api/stylist/* routes so they act on the signed-in
// stylist's own Stripe accounts instead of the business's.
export function StylistSubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stylist/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert(data.error || "Something went wrong starting checkout — try again.");
    }
  }

  return (
    <button className="btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "Subscribe"}
    </button>
  );
}

export function StylistManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stylist/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert(data.error || "Something went wrong opening billing — try again.");
    }
  }

  return (
    <button className="btn-ghost" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "Manage billing"}
    </button>
  );
}

export function StylistConnectButton({ alreadyConnected }: { alreadyConnected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stylist/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "Something went wrong — try again.");
    } catch {
      alert("Couldn't reach the server — try again.");
    }
    setLoading(false);
  }

  return (
    <button className="btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : alreadyConnected ? "Finish/update payment setup" : "Connect Stripe to get paid"}
    </button>
  );
}
