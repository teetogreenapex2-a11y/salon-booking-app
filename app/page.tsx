import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ReturningCustomerRedirect from "@/components/ReturningCustomerRedirect";

export const metadata = {
  title: "Hairsalonix — Booking software for salons & independent stylists",
  description:
    "Online booking, a real admin calendar, customer history, and no-show protection — built for salons with a team and for stylists renting their own chair. One flat price, no commission.",
};

export const dynamic = "force-dynamic";

export default async function MarketingHome({
  searchParams,
}: {
  searchParams?: { stay?: string };
}) {
  // Owners and stylists who are already signed in go straight to their
  // admin; everyone else sees the marketing page.
  const session = await getServerSession(authOptions);
  if (session?.user && !searchParams?.stay) redirect("/admin");

  return (
    <>
      {!searchParams?.stay && <ReturningCustomerRedirect />}
      <style>{`
        .mkt { --mk-ink:#241c1f; --mk-ink-soft:#5a4f52; --mk-berry:#7f2d4a; --mk-berry-deep:#5c2130;
               --mk-cream:#faf6f3; --mk-card:#ffffff; --mk-blush:#f3e3ec; --mk-line:rgba(36,28,31,0.12); }
        .mkt { font-family: "Work Sans", system-ui, sans-serif; color: var(--mk-ink); background: var(--mk-cream); min-height: 100vh; }
        .mkt .mkt-display { font-family: "Fraunces", serif; }
        .mkt .mkt-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
        .mkt a { color: inherit; text-decoration: none; }
        .mkt .mkt-btn { display: inline-flex; align-items: center; justify-content: center; padding: 13px 26px;
          border-radius: 999px; font-weight: 600; font-size: 15px; cursor: pointer; border: 1px solid transparent; }
        .mkt .mkt-btn-primary { background: var(--mk-berry); color: #fff; }
        .mkt .mkt-btn-ghost { background: transparent; color: var(--mk-ink); border-color: var(--mk-line); }
        .mkt .mkt-btn-ghost-light { background: transparent; color: #fff; border-color: rgba(255,255,255,0.4); }
        .mkt .mkt-eyebrow { font-size: 12.5px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: var(--mk-berry); }
        .mkt .mkt-card { background: var(--mk-card); border: 1px solid var(--mk-line); border-radius: 18px; padding: 28px; }
        .mkt .mkt-badge { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 5px 12px; border-radius: 999px; }
        .mkt .mkt-badge-live { background: #e3f1e6; color: #2e7d4f; }
        .mkt .mkt-badge-soon { background: #f3e3ec; color: var(--mk-berry-deep); }
        .mkt .mkt-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .mkt .mkt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .mkt .mkt-nav-links { display: flex; align-items: center; gap: 28px; font-size: 14.5px; font-weight: 500; }
        @media (max-width: 900px) {
          .mkt .mkt-grid-3 { grid-template-columns: 1fr 1fr; }
          .mkt .mkt-grid-2 { grid-template-columns: 1fr; }
          .mkt .mkt-nav-links { gap: 14px; }
          .mkt .mkt-nav-links .mkt-nav-text { display: none; }
          .mkt h1.mkt-hero-title { font-size: 38px !important; }
        }
        @media (max-width: 600px) {
          .mkt .mkt-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mkt">
        {/* NAV */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(250,246,243,0.92)", backdropFilter: "blur(6px)", borderBottom: "1px solid var(--mk-line)" }}>
          <div className="mkt-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
            <div className="mkt-display" style={{ fontSize: 22, fontWeight: 600 }}>Hairsalonix</div>
            <div className="mkt-nav-links">
              <a href="#features" className="mkt-nav-text">Features</a>
              <a href="#roadmap" className="mkt-nav-text">What&rsquo;s coming</a>
              <a href="#pricing" className="mkt-nav-text">Pricing</a>
              <Link href="/find" className="mkt-nav-text">Find a salon</Link>
              <Link href="/login" style={{ fontWeight: 600 }}>Sign in</Link>
              <Link href="/onboarding" className="mkt-btn mkt-btn-primary" style={{ padding: "10px 22px" }}>Start free trial</Link>
            </div>
          </div>
        </div>

        {/* HERO */}
        <div style={{ padding: "96px 0 90px" }}>
          <div className="mkt-wrap" style={{ maxWidth: 760, textAlign: "center", margin: "0 auto" }}>
            <div className="mkt-eyebrow" style={{ marginBottom: 18 }}>Booking software for salons &amp; independent stylists</div>
            <h1 className="mkt-display mkt-hero-title" style={{ fontSize: 56, lineHeight: 1.08, fontWeight: 600, margin: "0 0 22px" }}>
              Run your whole salon from one calendar.
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--mk-ink-soft)", margin: "0 0 34px" }}>
              Online booking, a real admin calendar, customer history, and no-show protection — built for salons with
              a team and for stylists renting their own chair. One flat price — no add-on fees, no commission on
              your bookings.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/onboarding" className="mkt-btn mkt-btn-primary" style={{ padding: "15px 30px", fontSize: 16 }}>
                Start your 14-day free trial
              </Link>
              <Link href="/find" className="mkt-btn mkt-btn-ghost" style={{ padding: "15px 30px", fontSize: 16 }}>
                Booking an appointment? Find your salon
              </Link>
            </div>
            <p style={{ fontSize: 13, color: "var(--mk-ink-soft)", marginTop: 16 }}>
              No credit card tricks — $20/mo after your trial, cancel anytime.
            </p>
          </div>
        </div>

        {/* VALUE STRIP */}
        <div style={{ borderTop: "1px solid var(--mk-line)", borderBottom: "1px solid var(--mk-line)", background: "var(--mk-card)" }}>
          <div className="mkt-wrap" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24, padding: "30px 32px" }}>
            <div style={{ flex: 1, minWidth: 220, textAlign: "center" }}>
              <div className="mkt-display" style={{ fontSize: 22, fontWeight: 600 }}>$20/mo</div>
              <div style={{ fontSize: 13.5, color: "var(--mk-ink-soft)" }}>to get your salon online</div>
            </div>
            <div style={{ flex: 1, minWidth: 220, textAlign: "center", borderLeft: "1px solid var(--mk-line)", borderRight: "1px solid var(--mk-line)" }}>
              <div className="mkt-display" style={{ fontSize: 22, fontWeight: 600 }}>No add-ons, no commission</div>
              <div style={{ fontSize: 13.5, color: "var(--mk-ink-soft)" }}>one flat price — we never take a cut of your bookings</div>
            </div>
            <div style={{ flex: 1, minWidth: 220, textAlign: "center" }}>
              <div className="mkt-display" style={{ fontSize: 22, fontWeight: 600 }}>Solo or team</div>
              <div style={{ fontSize: 13.5, color: "var(--mk-ink-soft)" }}>works the same for one chair or a full salon</div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div id="features" style={{ padding: "100px 0 30px" }}>
          <div className="mkt-wrap">
            <div style={{ maxWidth: 620, margin: "0 auto 56px", textAlign: "center" }}>
              <div className="mkt-eyebrow" style={{ marginBottom: 14 }}>Live today</div>
              <h2 className="mkt-display" style={{ fontSize: 38, fontWeight: 600, margin: "0 0 14px" }}>Everything below is already built</h2>
              <p style={{ fontSize: 16, color: "var(--mk-ink-soft)", lineHeight: 1.6 }}>
                This isn&rsquo;t a roadmap slide — it&rsquo;s what&rsquo;s running in production right now.
              </p>
            </div>

            <div className="mkt-grid-3">
              {[
                ["Online booking page", "Clients pick a service, a stylist, and an open time slot — booked in under a minute, no app to download."],
                ["Import your whole client list", "Already on Booksy, Vagaro, Square, Fresha, or GlossGenius? Export your client list as a CSV and bring every customer over in minutes — no manual re-entry, no lost history."],
                ["Full admin calendar", "A real day-grid calendar, color-coded by service and filterable by stylist, so you can see the whole day at a glance."],
                ["Customer profiles & rebooking", "Full visit history and no-show tracking per customer, with one click to book their next appointment."],
                ["Stylist & service manager", "Add stylists, set services and pricing, and manage weekly hours — all from the admin dashboard."],
                ["Revenue & booking reports", "Monthly revenue and bookings broken down by stylist, plus no-show and cancellation tracking."],
                ["No-show protection", "A card on file at booking, so you can charge your own no-show fee with one click when a client doesn’t show."],
                ["Payments to your own account", "Connected through your own Stripe account, so customer charges land directly in your business’s bank account."],
                ["Photo gallery", "Show off real work right on your public booking page."],
                ["Built for solo stylists too", "An independent account works exactly like a one-person salon — same features, same simple price."],
              ].map(([title, body]) => (
                <div className="mkt-card" key={title}>
                  <span className="mkt-badge mkt-badge-live">Live</span>
                  <h3 className="mkt-display" style={{ fontSize: 19, margin: "14px 0 8px" }}>{title}</h3>
                  <p style={{ fontSize: 14.5, color: "var(--mk-ink-soft)", lineHeight: 1.6, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOOTH RENTER BAND */}
        <div style={{ margin: "100px 0", padding: "72px 0", background: "var(--mk-ink)", color: "#fff" }}>
          <div className="mkt-wrap" style={{ maxWidth: 780, textAlign: "center" }}>
            <div className="mkt-eyebrow" style={{ color: "#e9b8cb", marginBottom: 16 }}>Built for how salons actually work</div>
            <h2 className="mkt-display" style={{ fontSize: 32, fontWeight: 600, margin: "0 0 18px" }}>
              Whether you own the salon or rent the chair
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.7, color: "rgba(255,255,255,0.78)", margin: "0 0 30px" }}>
              Salon owners and booth-renting stylists get the same booking page, the same calendar, and the same
              customer tools today. Independent stylists already run on their own standalone account — and
              per-stylist payouts for renters sharing a salon calendar are next on the roadmap below.
            </p>
            <a href="#roadmap" className="mkt-btn mkt-btn-ghost-light">See what&rsquo;s coming</a>
          </div>
        </div>

        {/* ROADMAP */}
        <div id="roadmap" style={{ padding: "10px 0 100px" }}>
          <div className="mkt-wrap">
            <div style={{ maxWidth: 620, margin: "0 auto 56px", textAlign: "center" }}>
              <div className="mkt-eyebrow" style={{ marginBottom: 14 }}>Coming soon</div>
              <h2 className="mkt-display" style={{ fontSize: 38, fontWeight: 600, margin: "0 0 14px" }}>What we&rsquo;re building next</h2>
              <p style={{ fontSize: 16, color: "var(--mk-ink-soft)", lineHeight: 1.6 }}>
                We&rsquo;d rather tell you what&rsquo;s not built yet than let you find out the hard way.
              </p>
            </div>

            <div className="mkt-grid-3">
              {[
                ["SMS & email reminders", "Automatic day-before text reminders and email confirmations."],
                ["Deposits at booking", "Require a prepayment up front for higher-value services."],
                ["Per-stylist payouts", "Booth renters sharing a salon calendar get paid directly to their own account."],
                ["Client self-service", "Customers reschedule or cancel their own appointment from a link."],
                ["Waitlists", "Automatically fill last-minute cancellations."],
                ["Memberships & gift cards", "Sell bundles, recurring plans, and gift cards online."],
                ["Calendar sync", "Two-way sync with Google and Outlook calendars per stylist."],
                ["Review requests", "Automatic post-visit requests for reviews."],
                ["Email marketing", "Simple campaigns to bring past clients back."],
                ["Retail / product sales", "Let stylists sell the hair products they use and recommend, right from their page."],
                ["Lower payment processing rates", "As more salons process through the platform, we negotiate better rates and pass the savings straight through — no markup, ever."],
              ].map(([title, body]) => (
                <div className="mkt-card" style={{ background: "var(--mk-blush)", borderColor: "transparent" }} key={title}>
                  <span className="mkt-badge mkt-badge-soon">Coming soon</span>
                  <h3 className="mkt-display" style={{ fontSize: 18, margin: "14px 0 8px" }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "var(--mk-ink-soft)", lineHeight: 1.6, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div id="pricing" style={{ padding: "10px 0 100px", background: "var(--mk-card)", borderTop: "1px solid var(--mk-line)", borderBottom: "1px solid var(--mk-line)" }}>
          <div className="mkt-wrap" style={{ paddingTop: 90 }}>
            <div style={{ maxWidth: 620, margin: "0 auto 56px", textAlign: "center" }}>
              <div className="mkt-eyebrow" style={{ marginBottom: 14 }}>Pricing</div>
              <h2 className="mkt-display" style={{ fontSize: 38, fontWeight: 600, margin: "0 0 14px" }}>One flat price. No add-ons. No commissions.</h2>
              <p style={{ fontSize: 16, color: "var(--mk-ink-soft)", lineHeight: 1.6 }}>
                14-day free trial on every plan. Cancel anytime from your own billing portal. No per-SMS fees, no
                per-booking cut of your revenue — ever.
              </p>
            </div>

            <div className="mkt-grid-2" style={{ maxWidth: 760, margin: "0 auto 70px" }}>
              <div className="mkt-card" style={{ textAlign: "center" }}>
                <div className="mkt-eyebrow" style={{ marginBottom: 10 }}>Independent stylist</div>
                <div className="mkt-display" style={{ fontSize: 40, fontWeight: 600 }}>
                  $20<span style={{ fontSize: 16, fontWeight: 500, color: "var(--mk-ink-soft)" }}>/mo</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--mk-ink-soft)", margin: "10px 0 20px" }}>
                  Flat rate. For booth renters and solo stylists running their own calendar.
                </p>
                <Link href="/onboarding" className="mkt-btn mkt-btn-primary" style={{ width: "100%" }}>Start free trial</Link>
              </div>
              <div className="mkt-card" style={{ textAlign: "center", borderColor: "var(--mk-berry)" }}>
                <div className="mkt-eyebrow" style={{ marginBottom: 10 }}>Salon</div>
                <div className="mkt-display" style={{ fontSize: 40, fontWeight: 600 }}>
                  $20<span style={{ fontSize: 16, fontWeight: 500, color: "var(--mk-ink-soft)" }}>/mo + $10/stylist</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--mk-ink-soft)", margin: "10px 0 20px" }}>
                  Base price covers your first stylist; add the rest of your team for $10/mo each.
                </p>
                <Link href="/onboarding" className="mkt-btn mkt-btn-primary" style={{ width: "100%" }}>Start free trial</Link>
              </div>
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", overflowX: "auto", border: "1px solid var(--mk-line)", borderRadius: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(170px,1.3fr) minmax(130px,1fr) minmax(130px,1fr) minmax(190px,1.3fr)", minWidth: 720 }}>
                <div style={{ padding: "16px 18px", background: "var(--mk-ink)", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>Platform</div>
                <div style={{ padding: "16px 18px", background: "var(--mk-ink)", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>Starting price</div>
                <div style={{ padding: "16px 18px", background: "var(--mk-ink)", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>SMS reminders</div>
                <div style={{ padding: "16px 18px", background: "var(--mk-ink)", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>Payment processing</div>

                <div style={{ padding: "16px 18px", fontSize: 14, fontWeight: 700, background: "var(--mk-blush)" }}>Hairsalonix</div>
                <div style={{ padding: "16px 18px", fontSize: 14, background: "var(--mk-blush)" }}>$20/mo (+$10/stylist)</div>
                <div style={{ padding: "16px 18px", fontSize: 14, background: "var(--mk-blush)" }}>Coming soon</div>
                <div style={{ padding: "16px 18px", fontSize: 14, background: "var(--mk-blush)" }}>Stripe&rsquo;s standard rate, zero markup</div>

                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Booksy</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Free – paid tiers</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Often included</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Booksy-controlled checkout</div>

                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Vagaro</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>~$25/mo+</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>~$20/mo add-on</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Vagaro-controlled checkout</div>

                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Square Appointments</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Free – paid tiers</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Paid add-on</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Square only, locked in</div>

                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Fresha</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Free, commission-based</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Paid add-on</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Fresha-controlled checkout</div>

                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>GlossGenius</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>$24–148/mo (2 to unlimited staff)</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>Included on Gold &amp; up</div>
                <div style={{ padding: "16px 18px", fontSize: 14, borderTop: "1px solid var(--mk-line)" }}>GlossGenius-controlled, 2.6%/txn</div>
              </div>
            </div>
            <p style={{ maxWidth: 900, margin: "14px auto 0", fontSize: 12, color: "var(--mk-ink-soft)" }}>
              Competitor pricing is approximate and may have changed — confirm current rates directly with each
              provider. Scroll sideways on narrow screens to see every column.
            </p>
          </div>
        </div>

        {/* FINAL CTA */}
        <div style={{ padding: "100px 0", textAlign: "center" }}>
          <div className="mkt-wrap" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2 className="mkt-display" style={{ fontSize: 34, fontWeight: 600, margin: "0 0 16px" }}>Get your booking page live today</h2>
            <p style={{ fontSize: 16, color: "var(--mk-ink-soft)", margin: "0 0 30px" }}>14 days free. No setup calls required.</p>
            <Link href="/onboarding" className="mkt-btn mkt-btn-primary" style={{ padding: "16px 34px", fontSize: 16 }}>
              Start your free trial
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: "1px solid var(--mk-line)", padding: "30px 0" }}>
          <div className="mkt-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--mk-ink-soft)", flexWrap: "wrap", gap: 12 }}>
            <div className="mkt-display" style={{ fontWeight: 600, color: "var(--mk-ink)" }}>Hairsalonix</div>
            <Link href="/find">Find a salon</Link>
            <div>© 2026 Hairsalonix</div>
          </div>
        </div>
      </div>
    </>
  );
}
