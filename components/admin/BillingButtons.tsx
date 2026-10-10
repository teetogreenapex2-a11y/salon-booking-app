"use client";

import { useState } from "react";

// Posts to a billing route and follows the Stripe link it returns. If the
// server fails, it shows Stripe's actual message instead of hanging.
async function goToStripe(path: string, fallback: string) {
  try {
    const res = await fetch(path, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return true;
    }
    alert(data.error || fallback);
  } catch {
    alert("Couldn't reach the server — try again.");
  }
  return false;
}

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const ok = await goToStripe("/api/billing/checkout", "Something went wrong — try again.");
    if (!ok) setLoading(false);
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
    const ok = await goToStripe("/api/billing/portal", "Something went wrong — try again.");
    if (!ok) setLoading(false);
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
    const ok = await goToStripe("/api/billing/connect", "Something went wrong — try again.");
    if (!ok) setLoading(false);
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
    const ok = await goToStripe("/api/stylist/checkout", "Something went wrong — try again.");
    if (!ok) setLoading(false);
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
    const ok = await goToStripe("/api/stylist/portal", "Something went wrong — try again.");
    if (!ok) setLoading(false);
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
    const ok = await goToStripe("/api/stylist/connect", "Something went wrong — try again.");
    if (!ok) setLoading(false);
  }

  return (
    <button className="btn-primary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : alreadyConnected ? "Finish/update payment setup" : "Connect Stripe to get paid"}
    </button>
  );
}
