"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // callbackUrl tells the emailed link where to send you AFTER you click
    // it and it verifies — without this it defaults back to /login, which
    // looks like nothing happened. /onboarding sends you straight to
    // business setup, or on to /admin automatically if you already have one.
    await signIn("email", { email, redirect: false, callbackUrl: "/onboarding" });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <main className="page" style={{ maxWidth: 420 }}>
        <h1 className="display title">Check your email</h1>
        <p className="tagline">
          We sent a sign-in link to <strong>{email}</strong>. Click it to continue — you can close this tab.
        </p>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 className="display title">Sign in</h1>
      <p className="tagline">Enter your email and we&apos;ll send you a link to sign in — no password needed.</p>
      <form onSubmit={handleSubmit} className="customer-form">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
    </main>
  );
}
