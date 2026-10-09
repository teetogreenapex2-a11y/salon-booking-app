export const dynamic = "force-static";

// Public page showing exactly how clients opt in to text messages, so carrier
// reviewers (and clients) can see the consent without walking through a booking.
export default function SmsOptIn() {
  return (
    <main className="page" style={{ maxWidth: 640 }}>
      <h1 className="display" style={{ fontSize: 32, marginBottom: 4 }}>
        Text message sign-up
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Hairsalonix Appointment Notifications, operated by Tee to Green Golf
      </p>

      <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
        Clients of salons and stylists that use Hairsalonix can choose to receive text messages about their
        own appointments. This is the opt-in shown on every booking page, right under the phone number
        field. The box is never pre-checked, and booking does not require it.
      </p>

      <div className="customer-form" style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p className="subtle" style={{ fontWeight: 500, marginBottom: 8 }}>Your details</p>
        <input placeholder="Full name" disabled />
        <input placeholder="Email" disabled />
        <input placeholder="Phone" type="tel" disabled />
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          <input type="checkbox" disabled style={{ width: "auto", marginTop: 3, flexShrink: 0 }} />
          <span>
            Text me appointment confirmation and reminder messages about my booking. Sent through
            Hairsalonix on behalf of the business I'm booking with, which is operated by Tee to Green Golf.
            Message frequency varies (about 1 confirmation and 1 reminder per appointment). Msg &amp; data
            rates may apply. Reply HELP for help, STOP to opt out. Consent is not required to book. See our{" "}
            <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
          </span>
        </label>
        <button type="button" disabled style={{ marginTop: 12 }}>Book appointment</button>
      </div>

      <h2 className="display" style={{ fontSize: 20, marginBottom: 8 }}>What happens next</h2>
      <p style={{ lineHeight: 1.7, marginBottom: 12 }}>
        Only clients who tick the box receive texts: one confirmation right after booking, and one
        reminder before the appointment. Example confirmation:
      </p>
      <blockquote style={{ margin: "0 0 16px", padding: "10px 14px", background: "rgba(0,0,0,0.04)", borderRadius: 8 }}>
        [Salon Name]: You're booked for [Date and Time]. Details: https://hairsalonix.com/[salon-name]/booking/[id].
        Reply STOP to opt out, HELP for help.
      </blockquote>
      <p style={{ lineHeight: 1.7 }}>
        Reply <strong>STOP</strong> at any time to stop receiving texts, or <strong>HELP</strong> for help. For
        support, email <a href="mailto:teetogreenapex2@gmail.com">teetogreenapex2@gmail.com</a>. Read our{" "}
        <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </main>
  );
}
