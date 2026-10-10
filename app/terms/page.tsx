export const dynamic = "force-static";

export default function TermsAndConditions() {
  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <h1 className="display" style={{ fontSize: 32, marginBottom: 4 }}>
        Terms and Conditions
      </h1>
      <p className="subtle" style={{ marginBottom: 32 }}>Last updated October 2026</p>

      <Section title="Program name">
        <p>Hairsalonix Appointment Notifications</p>
      </Section>

      <Section title="Program description">
        <p>
          Hairsalonix, operated by Tee to Green Golf, provides online booking software for salons and independent stylists. When you
          book an appointment through a Hairsalonix-powered booking page and provide your phone number and tick the text-message consent box,
          the business you booked with may send you text messages confirming your appointment and
          reminding you of it before your scheduled time.
        </p>
      </Section>

      <Section title="Message frequency">
        <p>
          Message frequency varies based on your bookings. You can generally expect one confirmation text
          per appointment booked, and one reminder text per upcoming appointment.
        </p>
      </Section>

      <Section title="Message and data rates">
        <p>Message and data rates may apply, depending on your mobile carrier and plan.</p>
      </Section>

      <Section title="Opt-out instructions">
        <p>
          Reply <strong>STOP</strong> at any time to stop receiving text messages. Reply{" "}
          <strong>HELP</strong> for help. You can also contact the business you booked with directly, or
          contact us at the email below.
        </p>
      </Section>

      <Section title="Support contact">
        <p>
          For support, email{" "}
          <a href="mailto:teetogreenapex2@gmail.com">teetogreenapex2@gmail.com</a>.
        </p>
      </Section>

      <Section title="Carriers and privacy">
        <p>
          Carriers are not liable for delayed or undelivered messages. Consent to receive text messages is
          not a condition of booking. See our <a href="/privacy">Privacy Policy</a> for how we handle your
          information.
        </p>
        <p>
          No mobile information will be shared with third parties or affiliates for marketing or promotional
          purposes. Text messaging originator opt-in data and consent will not be shared with any third parties.
        </p>
      </Section>

      <Section title="Use of the platform">
        <p>
          Businesses using Hairsalonix are responsible for the accuracy of the services, pricing, and
          availability they list on their booking page. Customers are responsible for providing accurate
          contact information when booking an appointment. Hairsalonix is not responsible for
          disputes between a customer and a business regarding a specific appointment.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms from time to time. Continued use of Hairsalonix after changes are
          posted constitutes acceptance of the updated terms.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 className="display" style={{ fontSize: 20, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ lineHeight: 1.7, color: "rgba(36, 28, 31, 0.9)" }}>{children}</div>
    </section>
  );
}
