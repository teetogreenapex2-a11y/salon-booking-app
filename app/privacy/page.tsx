export const dynamic = "force-static";

export default function PrivacyPolicy() {
  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <h1 className="display" style={{ fontSize: 32, marginBottom: 4 }}>
        Privacy Policy
      </h1>
      <p className="subtle" style={{ marginBottom: 32 }}>Last updated October 2026</p>

      <Section title="Who we are">
        <p>
          Hairsalonix ("Hairsalonix," "we," "us"), operated by Tee to Green Golf, provides online booking software that salons and
          independent stylists ("businesses") use to run their own scheduling pages. This policy covers
          both the businesses that use Hairsalonix and the customers who book appointments through a
          Hairsalonix-powered booking page.
        </p>
      </Section>

      <Section title="Information we collect">
        <ul>
          <li>
            <strong>Business account information:</strong> name, email, business name, address, and
            service/stylist details entered by the business.
          </li>
          <li>
            <strong>Customer booking information:</strong> name, email, phone number, and appointment
            details provided when booking an appointment.
          </li>
          <li>
            <strong>Payment information:</strong> processed and stored directly by Stripe, our payment
            processor — we do not store full card numbers on our own servers.
          </li>
        </ul>
      </Section>

      <Section title="How we use information">
        <ul>
          <li>To create and manage appointment bookings</li>
          <li>To send appointment confirmations and reminder text messages or emails</li>
          <li>To process payments and no-show fees through Stripe</li>
          <li>To provide customer support and maintain the security of the platform</li>
        </ul>
      </Section>

      <Section title="Text messages (SMS)">
        <p>
          If you provide a phone number when booking an appointment and tick the text-message consent box, you may receive appointment
          confirmation and reminder text messages from the business you booked with, sent through our
          platform. Message and data rates may apply. Reply <strong>STOP</strong> to any message to stop
          receiving texts, or <strong>HELP</strong> for help. We do not sell or share your SMS opt-in
          data or personal information with third parties for marketing purposes.
        </p>
      </Section>

      <Section title="Who we share information with">
        <p>We share information only with the service providers that help us operate the platform:</p>
        <ul>
          <li><strong>Stripe</strong> — payment processing and billing</li>
          <li><strong>Twilio</strong> — sending text message confirmations and reminders</li>
          <li><strong>Resend</strong> — sending account sign-in and email confirmations</li>
        </ul>
        <p>We do not sell personal information to third parties.</p>
      </Section>

      <Section title="Data retention">
        <p>
          We retain booking and account information for as long as a business maintains an active
          account, or as needed to comply with legal obligations.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          Customers can contact the business they booked with directly to request their information be
          corrected or removed. Businesses can contact us directly for account-level requests.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about this policy can be sent to{" "}
          <a href="mailto:teetogreenapex2@gmail.com">teetogreenapex2@gmail.com</a>.
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
