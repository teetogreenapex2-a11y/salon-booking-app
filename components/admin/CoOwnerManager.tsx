"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; email: string };

export default function CoOwnerManager({
  ownerEmail,
  initialMembers,
  canManage,
}: {
  ownerEmail: string;
  initialMembers: Member[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/co-owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Couldn't add that person — try again.");
      return;
    }
    setMembers((m) => [...m, { id: data.id, email: data.email }]);
    setEmail("");
    router.refresh();
  }

  async function remove(id: string, memberEmail: string) {
    if (!window.confirm(`Remove ${memberEmail} as a co-owner? They'll lose access to this business.`)) return;
    setRemoving(id);
    const res = await fetch("/api/admin/co-owners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRemoving(null);
    if (res.ok) {
      setMembers((m) => m.filter((x) => x.id !== id));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Couldn't remove them — try again.");
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h2 className="display" style={{ fontSize: 20, marginBottom: 6 }}>
        Owners
      </h2>
      <p className="subtle" style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>
        Everyone listed here signs in with their own login and gets full access to this business — the
        calendar, customers, billing and settings.
      </p>

      <div className="list" style={{ marginBottom: 16 }}>
        <div className="card static" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="name">{ownerEmail}</span>
          <span className="subtle" style={{ fontSize: 12 }}>Account owner</span>
        </div>
        {members.map((m) => (
          <div key={m.id} className="card static" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span className="name" style={{ minWidth: 0, wordBreak: "break-all" }}>{m.email}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="subtle" style={{ fontSize: 12 }}>Co-owner</span>
              {canManage && (
                <button
                  className="btn-ghost"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => remove(m.id, m.email)}
                  disabled={removing === m.id}
                >
                  {removing === m.id ? "Removing…" : "Remove"}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {canManage ? (
        <form onSubmit={add} style={{ maxWidth: 420 }}>
          <label className="subtle" style={{ fontSize: 12 }}>Add a co-owner by email</label>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              type="email"
              placeholder="partner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
          {error && <p style={{ color: "#b00020", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
          <p className="subtle" style={{ fontSize: 12, margin: "8px 0 0" }}>
            They&rsquo;ll get an email and can sign in at hairsalonix.com/login with this address.
          </p>
        </form>
      ) : (
        <p className="subtle" style={{ fontSize: 12 }}>
          Only the account owner can add or remove co-owners.
        </p>
      )}
    </div>
  );
}
