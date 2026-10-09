"use client";

import { useState } from "react";
import Link from "next/link";

// The same contact step every booking form shows: name, email, a phone
// number, and a SEPARATE, unchecked, optional text-message checkbox with
// its disclosures right beside it. Nothing typed here is stored.
export default function SmsOptInForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  return (
    <div className="customer-form" style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <p className="subtle" style={{ fontWeight: 500, marginBottom: 8 }}>Your details</p>
      <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ width: "auto", marginTop: 3, flexShrink: 0 }}
        />
        <span>
          Optional: text me appointment confirmation and reminder messages about my booking. Sent through
          Hairsalonix on behalf of the business I&apos;m booking with, which is operated by Tee to Green Golf.
          Message frequency varies (about 1 confirmation and 1 reminder per appointment). Msg &amp; data
          rates may apply. Reply STOP to cancel, HELP for help. Consent is not required to book. See our{" "}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
        </span>
      </label>

      <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
        The box starts unchecked and is separate from booking. A client can complete a booking without ticking it,
        and then receives only email.
      </p>

      <Link href="/find" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 12, textDecoration: "none" }}>
        Find your salon to book
      </Link>
      <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
        This page shows the sign-up step so you can see it. Nothing entered here is saved or sent; the real
        choice is made on a salon&apos;s booking form.
      </p>
    </div>
  );
}
