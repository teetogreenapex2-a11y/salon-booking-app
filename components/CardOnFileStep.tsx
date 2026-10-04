"use client";

import { useEffect, useState } from "react";
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

type CustomerInfo = { name: string; email: string; phone: string };

// Shown as a step in both the public and admin booking flows, right after
// a time slot is picked. Collects a card on file via Stripe Elements under
// the salon's own connected Stripe account, so a later no-show fee (or
// deposit, eventually) charges the customer's card directly to the salon's
// bank account rather than Hairsalonix's. If the salon hasn't connected
// Stripe yet, the backend returns { skip: true } and this step is skipped
// entirely — booking still proceeds normally, just with no card held.
export default function CardOnFileStep({
  businessSlug,
  stylistId,
  customer,
  onDone,
}: {
  businessSlug: string;
  stylistId: string;
  customer: CustomerInfo;
  onDone: (customerId: string | null) => void;
}) {
  const [stripePromise, setStripePromise] = useState<Promise<StripeJS | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookings/card-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessSlug, customer, stylistId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.skip) {
          onDone(data.customerId ?? null);
          return;
        }
        setCustomerId(data.customerId);
        setClientSecret(data.clientSecret);
        setConnectedAccountId(data.connectedAccountId);
        setStripePromise(
          loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
            stripeAccount: data.connectedAccountId,
          })
        );
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't start card setup — try again.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="subtle" style={{ color: "#b3261e" }}>{error}</p>;
  }

  if (!clientSecret || !stripePromise || !customerId || !connectedAccountId) {
    return <p className="subtle">Loading secure card form…</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardForm
        clientSecret={clientSecret}
        customerId={customerId}
        connectedAccountId={connectedAccountId}
        onDone={onDone}
      />
    </Elements>
  );
}

function CardForm({
  clientSecret,
  customerId,
  connectedAccountId,
  onDone,
}: {
  clientSecret: string;
  customerId: string;
  connectedAccountId: string;
  onDone: (customerId: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) {
      setSubmitting(false);
      return;
    }

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      setError(result.error.message || "Card couldn't be saved — try another card.");
      setSubmitting(false);
      return;
    }

    await fetch("/api/bookings/card-setup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        setupIntentId: result.setupIntent.id,
        connectedAccountId,
      }),
    });

    setSubmitting(false);
    onDone(customerId);
  }

  return (
    <div className="customer-form">
      <p className="subtle" style={{ fontWeight: 500, marginBottom: 8 }}>
        Save a card on file to hold your appointment
      </p>
      <div
        style={{
          padding: "12px",
          border: "1px solid rgba(36,28,31,0.15)",
          borderRadius: 6,
          background: "#fff",
        }}
      >
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      </div>
      {error && (
        <p className="subtle" style={{ color: "#b3261e", marginTop: 8 }}>
          {error}
        </p>
      )}
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save card & confirm booking"}
      </button>
    </div>
  );
}
