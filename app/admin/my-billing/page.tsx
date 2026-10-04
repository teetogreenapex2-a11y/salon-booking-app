import { redirect } from "next/navigation";
import { getCurrentStylist } from "@/lib/auth";
import {
  StylistSubscribeButton,
  StylistManageBillingButton,
  StylistConnectButton,
} from "@/components/admin/BillingButtons";

export const dynamic = "force-dynamic";

function statusDisplay(status: string | null) {
  if (status === "active") return { label: "Active", color: "#2f8a52" };
  if (status === "trialing") return { label: "Active (trial)", color: "#2f8a52" };
  if (status === "past_due") return { label: "Payment failed — update your card", color: "#b3261e" };
  if (status === "canceled") return { label: "Canceled", color: "#b3261e" };
  return { label: "No active subscription", color: "#b3261e" };
}

export default async function MyBillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string; connected?: string };
}) {
  const stylist = await getCurrentStylist();

  // This page only exists for booth renters — an owner has their own
  // /admin/billing, and a regular (non-booth-renting) stylist has no
  // billing of their own to see.
  if (!stylist || (!stylist.independentPayouts && !stylist.independentBilling)) {
    redirect("/admin/calendar");
  }

  const status = statusDisplay(stylist.subscriptionStatus);
  const hasSubscription = !!stylist.stripeSubscriptionId;

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        My billing
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Your own Hairsalonix billing, separate from the salon&rsquo;s.
      </p>

      {searchParams.success && (
        <div className="card static" style={{ marginBottom: 20, background: "var(--blush)", borderColor: "var(--berry)" }}>
          <p className="name" style={{ margin: 0 }}>Subscription started — thank you!</p>
        </div>
      )}
      {searchParams.canceled && (
        <div className="card static" style={{ marginBottom: 20 }}>
          <p className="name" style={{ margin: 0 }}>Checkout canceled — no charge was made.</p>
        </div>
      )}
      {searchParams.connected && (
        <div className="card static" style={{ marginBottom: 20, background: "var(--blush)", borderColor: "var(--berry)" }}>
          <p className="name" style={{ margin: 0 }}>
            Payment setup {stylist.stripeChargesEnabled ? "complete" : "in progress"} —{" "}
            {stylist.stripeChargesEnabled
              ? "you can now hold cards on file."
              : "Stripe may still be reviewing a few details."}
          </p>
        </div>
      )}

      {stylist.independentBilling && (
        <>
          <h2 className="display" style={{ fontSize: 20, marginBottom: 8 }}>
            Your seat
          </h2>
          <div className="card static" style={{ marginBottom: 16 }}>
            <p className="name" style={{ color: status.color }}>
              {status.label}
            </p>
          </div>
          {hasSubscription ? <StylistManageBillingButton /> : <StylistSubscribeButton />}
        </>
      )}

      {stylist.independentPayouts && (
        <>
          <h2 className="display" style={{ fontSize: 20, margin: "36px 0 8px" }}>
            Accept your own payments
          </h2>
          <p className="subtle" style={{ marginBottom: 16, maxWidth: 520 }}>
            Connect your own Stripe account so no-show fees and deposits from your clients land in
            your bank account, not the salon&rsquo;s.
          </p>
          <div className="card static" style={{ marginBottom: 16 }}>
            <p className="name" style={{ color: stylist.stripeChargesEnabled ? "#2f8a52" : "#b3261e" }}>
              {stylist.stripeChargesEnabled ? "Ready to accept payments" : "Not connected yet"}
            </p>
          </div>
          <StylistConnectButton alreadyConnected={!!stylist.stripeConnectedAccountId} />
        </>
      )}
    </div>
  );
}
