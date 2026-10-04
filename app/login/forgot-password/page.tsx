"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <main className="page" style={{ maxWidth: 420 }}>
        <h1 className="display title">Check your email</h1>
        <p className="tagline">
          If an account exists for <strong>{email}</strong>, we sent a link to reset your password. It expires in 1
          hour.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 className="display title">Reset your password</h1>
      <p className="tagline">Enter your email and we&apos;ll send you a link to set a new password.</p>
      <form onSubmit={handleSubmit} className="customer-form">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
