"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"salon" | "independent">("salon");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<string>("");
  const [yourName, setYourName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, accountType, yourName, kind }),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <p className="subtle" style={{ fontWeight: 600, marginBottom: 8 }}>What describes you best?</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className={`card ${accountType === "salon" ? "selected" : ""}`}
          style={{ flex: 1, textAlign: "center" }}
          onClick={() => setAccountType("salon")}
        >
          <p className="name" style={{ margin: 0 }}>A salon with staff</p>
          <p className="subtle" style={{ margin: "4px 0 0" }}>One shared booking page, multiple stylists</p>
        </button>
        <button
          type="button"
          className={`card ${accountType === "independent" ? "selected" : ""}`}
          style={{ flex: 1, textAlign: "center" }}
          onClick={() => setAccountType("independent")}
        >
          <p className="name" style={{ margin: 0 }}>An independent stylist</p>
          <p className="subtle" style={{ margin: "4px 0 0" }}>My own booking page, just me</p>
        </button>
      </div>

      {accountType === "independent" && (
        <input
          placeholder="Your name (shown to clients)"
          value={yourName}
          onChange={(e) => setYourName(e.target.value)}
          required
        />
      )}

      <input
        placeholder={accountType === "independent" ? "Business name (e.g. Studio Fern)" : "Salon name"}
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        required
      />

      <div>
        <input
          placeholder="web address"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          required
        />
        <p className="subtle" style={{ fontSize: 12, marginTop: 4 }}>
          hairsalonix.com/{slug || "your-name"}
        </p>
      </div>

      <p className="subtle" style={{ fontWeight: 600, margin: "4px 0 8px" }}>What do you do?</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        {[
          ["hair", "Hair"],
          ["nails", "Nails"],
          ["both", "Hair & nails"],
          ["barber", "Barber"],
          ["", "Something else"],
        ].map(([v, label]) => (
          <button
            key={label}
            type="button"
            className={`btn-ghost ${kind === v ? "selected-tab" : ""}`}
            style={{ padding: "8px 14px", fontSize: 14 }}
            onClick={() => setKind(v)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="subtle" style={{ fontSize: 12, margin: 0 }}>
        We&rsquo;ll start you with a typical menu you can change anytime.
      </p>

      {error && <p style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>}

      <button className="btn-primary" type="submit" disabled={submitting} style={{ marginTop: 8 }}>
        {submitting ? "Setting up…" : "Create my account"}
      </button>
    </form>
  );
}
