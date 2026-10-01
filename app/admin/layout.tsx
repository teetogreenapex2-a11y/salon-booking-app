import { getCurrentBusiness } from "@/lib/auth";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();

  const subActive =
    business?.subscriptionStatus === "active" || business?.subscriptionStatus === "trialing";
  const trialActive = business?.trialEndsAt ? business.trialEndsAt > new Date() : false;
  // Shown once trial + subscription both lapse — doesn't block any page,
  // just nudges toward /admin/billing.
  const showBillingBanner = business && !subActive && !trialActive;

  return (
    <div>
      <div className="admin-nav">
        <span className="display admin-nav-title">Salon Admin</span>
        <AdminNav />
        <AdminLogoutButton />
      </div>

      {showBillingBanner && (
        <div
          style={{
            background: "#f3ddd9",
            borderBottom: "1px solid #b3563e",
            padding: "10px 16px",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Your free trial has ended.{" "}
          <Link href="/admin/billing" style={{ fontWeight: 600, textDecoration: "underline" }}>
            Subscribe to keep using Hairsalonix
          </Link>
        </div>
      )}

      <main className="admin-page">{children}</main>
    </div>
  );
}
