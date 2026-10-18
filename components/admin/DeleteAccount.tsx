"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

// Required by the App Store: people who can create an account in the app
// must also be able to delete it from inside the app.
export default function DeleteAccount({ canDelete }: { canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't delete the account. Please try again.");
        setBusy(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Couldn't reach the server — try again.");
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(36,28,31,0.1)" }}>
      <h2 className="display" style={{ fontSize: 20, marginBottom: 8 }}>
        Delete account
      </h2>
      {!canDelete ? (
        <p className="subtle" style={{ maxWidth: 520 }}>
          Only the account owner can delete the salon&rsquo;s account.
        </p>
      ) : !open ? (
        <>
          <p className="subtle" style={{ maxWidth: 520, marginBottom: 12 }}>
            Permanently deletes your salon, stylists, customers, bookings and everything else, and cancels your
            subscription. This cannot be undone.
          </p>
          <button className="btn-ghost" style={{ color: "#b00020" }} onClick={() => setOpen(true)}>
            Delete my account
          </button>
        </>
      ) : (
        <div style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="subtle">
            Type <strong>DELETE</strong> to confirm. Everything will be permanently removed.
          </p>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE" autoCapitalize="characters" />
          {error && <p style={{ color: "#b00020", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-ghost"
              style={{ color: "#b00020" }}
              disabled={busy || text.trim() !== "DELETE"}
              onClick={remove}
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button className="btn-ghost" disabled={busy} onClick={() => { setOpen(false); setText(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
