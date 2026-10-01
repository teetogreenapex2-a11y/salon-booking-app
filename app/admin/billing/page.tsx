import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubscribeButton, ManageBillingButton } from "@/components/admin/BillingButtons";

export const dynamic = "force-dynamic";

function statusDisplay(status: string | null, trialEndsAt: Date | null) {
  if (status === "active") return { label: "Active", color: "#2f8a52" };
  if (status === "trialing") return { label: "Active (trial)", color: "#2f8a52" };
  if (status === "past_due") return { label: "Payment failed — update your card", color: "#b3261e" };
  if (status === "canceled") return { label: "Canceled", color: "#b3261e" };
  if (trialEndsAt && trialEndsAt > new Date()) return { label: "Free trial", color: "#2f8a52" };
  return { label: "No active subscription", color: "#b3261e" };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  const stylistCount = await prisma.stylist.count({
    where: { businessId: business.id, active: true },
  });
  const addOnCount = Math.max(stylistCount - 1, 0);
  const monthlyTotal = 20 + addOnCount * 10;

  const status = statusDisplay(business.subscriptionStatus, business.trialEndsAt);
  const hasSubscription = !!business.stripeSubscriptionId;

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Billing
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Your Hairsalonix subscription
      </p>

      {searchParams.success && (
        <div
          className="card static"
          style={{ marginBottom: 20, background: "var(--blush)", borderColor: "var(--berry)" }}
        >
          <p className="name" style={{ margin: 0 }}>Subscription started — thank you!</p>
        </div>
      )}
      {searchParams.canceled && (
        <div className="card static" style={{ marginBottom: 20 }}>
          <p className="name" style={{ margin: 0 }}>Checkout canceled — no charge was made.</p>
        </div>
      )}

      <div className="card static" style={{ marginBottom: 20 }}>
        <div>
          <p className="name" style={{ color: status.color }}>
            {status.label}
          </p>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            {stylistCount} active stylist{stylistCount === 1 ? "" : "s"} · ${monthlyTotal}/month
            {addOnCount > 0 && ` ($20 base + $10 × ${addOnCount})`}
          </p>
          {business.trialEndsAt && business.trialEndsAt > new Date() && !hasSubscription && (
            <p className="subtle" style={{ margin: "4px 0 0" }}>
              Your free trial ends{" "}
              {business.trialEndsAt.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              .
            </p>
          )}
        </div>
      </div>

      {hasSubscription ? <ManageBillingButton /> : <SubscribeButton />}
    </div>
  );
}
