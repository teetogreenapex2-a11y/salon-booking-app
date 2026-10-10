"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { venmoUrl as buildVenmoUrl, cashAppUrl as buildCashAppUrl } from "@/lib/paymentHandles";

const METHODS = ["Venmo", "Cash App", "Zelle", "Cash"] as const;

// Lets the owner collect payment outside the app: shows the amount and a
// tap-to-pay link for the stylist's Venmo / Cash App, then records how the
// customer paid. No money moves through Hairsalonix here.
export default function CollectPaymentButton({
  bookingId,
  totalCents,
  note,
  venmoHandle,
  cashAppHandle,
  zelleInfo,
  paidMethod,
  creditCents = 0,
}: {
  bookingId: string;
  totalCents: number;
  note: string;
  venmoHandle: string | null;
  cashAppHandle: string | null;
  zelleInfo: string | null;
  paidMethod: string | null;
  creditCents?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [giftCode, setGiftCode] = useState("");

  const dueCents = totalCents - creditCents;
  const amount = (dueCents / 100).toFixed(2);
  const venmoUrl = venmoHandle ? buildVenmoUrl(venmoHandle, dueCents, note) : null;
  const cashAppUrl = cashAppHandle ? buildCashAppUrl(cashAppHandle, dueCents) : null;

  async function send(body: object) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/bookings/${bookingId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save that — try again.");
    }
  }

  async function applyGiftCard() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/bookings/${bookingId}/gift-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: giftCode }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setGiftCode("");
      setOpen(data.remaining > 0);
      router.refresh();
    } else {
      setError(data.error || "Couldn't apply that gift card.");
    }
  }

  if (paidMethod) {
    return (
      <span className="subtle" style={{ fontSize: 11 }}>
        Paid · {paidMethod}{" "}
        <button
          className="btn-ghost"
          style={{ padding: "2px 8px", fontSize: 11 }}
          onClick={() => send({ undo: true })}
          disabled={busy}
        >
          Undo
        </button>
      </span>
    );
  }

  if (!open) {
    return (
      <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setOpen(true)}>
        Collect payment
      </button>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(36,28,31,0.12)",
        borderRadius: 6,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 220,
      }}
    >
      <strong style={{ fontSize: 14 }}>${amount} due</strong>
      {creditCents > 0 && (
        <span className="subtle" style={{ fontSize: 12 }}>Gift card applied: ${(creditCents / 100).toFixed(2)}</span>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          placeholder="Gift card code"
          value={giftCode}
          onChange={(e) => setGiftCode(e.target.value)}
          style={{ flex: 1, minWidth: 0, fontSize: 12 }}
        />
        <button className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} disabled={busy || !giftCode} onClick={applyGiftCard}>
          Apply
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {venmoUrl && (
          <a className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} href={venmoUrl} target="_blank" rel="noopener noreferrer">
            Open Venmo
          </a>
        )}
        {cashAppUrl && (
          <a className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} href={cashAppUrl} target="_blank" rel="noopener noreferrer">
            Open Cash App
          </a>
        )}
      </div>
      {zelleInfo && <span className="subtle" style={{ fontSize: 12 }}>Zelle to: {zelleInfo}</span>}
      {!venmoUrl && !cashAppUrl && !zelleInfo && (
        <span className="subtle" style={{ fontSize: 12 }}>
          No Venmo, Cash App or Zelle set up for this stylist yet — add one on the Stylists page.
        </span>
      )}
      <span className="subtle" style={{ fontSize: 12 }}>Once they&rsquo;ve paid, mark how:</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {METHODS.map((m) => (
          <button
            key={m}
            className="btn-ghost"
            style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={() => send({ method: m })}
            disabled={busy}
          >
            {m}
          </button>
        ))}
      </div>
      {error && <span style={{ color: "#b00020", fontSize: 12 }}>{error}</span>}
      <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12, alignSelf: "flex-start" }} onClick={() => setOpen(false)}>
        Close
      </button>
    </div>
  );
}
