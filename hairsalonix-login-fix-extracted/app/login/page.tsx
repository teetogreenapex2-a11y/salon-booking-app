"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/onboarding",
    });
    setSubmitting(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    if (res?.url) {
      window.location.href = res.url;
    }
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

      {mode === "email" ? (
        <>
          <p className="tagline">Enter your email and we&apos;ll send you a link to sign in — no password needed.</p>
          <form onSubmit={handleEmailSubmit} className="customer-form">
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
          <p style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setMode("password")} className="link-btn">
              Have a password instead?
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="tagline">Sign in with your email and password.</p>
          <form onSubmit={handlePasswordSubmit} className="customer-form">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {error && (
            <p className="subtle" style={{ color: "#b00020", marginTop: 8 }}>
              {error}
            </p>
          )}
          <p style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setMode("email")} className="link-btn">
              Use an email link instead
            </button>
          </p>
        </>
      )}

      <style>{`
        .link-btn {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: inherit;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
