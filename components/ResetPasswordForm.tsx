"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!email || !token) {
    return (
      <p className="tagline">
        This reset link is missing some information — go back to{" "}
        <Link href="/login/forgot-password">request a new one</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <>
        <p className="tagline">Your password has been updated.</p>
        <p style={{ marginTop: 16 }}>
          <Link href="/login">Sign in with your new password</Link>
        </p>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — try requesting a new link.");
    }
  }

  return (
    <>
      <p className="tagline">
        Setting a new password for <strong>{email}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="customer-form">
        <input
          type="password"
          placeholder="New password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Set new password"}
        </button>
      </form>
      {error && (
        <p className="subtle" style={{ color: "#b00020", marginTop: 8 }}>
          {error}
        </p>
      )}
    </>
  );
}
