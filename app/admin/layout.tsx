import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminNav from "@/components/AdminNav";
import StylistNav from "@/components/StylistNav";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();
  // Only bother checking for a stylist account if this isn't the owner —
  // an owner's email never needs to also match a Stylist row.
  const stylist = business ? null : await getCurrentStylist();
  const isOwner = !!business;
  const activeBusiness = business ?? stylist?.business ?? null;

  const subActive =
    activeBusiness?.subscriptionStatus === "active" || activeBusiness?.subscriptionStatus === "trialing";
  const trialActive = activeBusiness?.trialEndsAt ? activeBusiness.trialEndsAt > new Date() : false;
  // Shown once trial + subscription both lapse — doesn't block any page,
  // just nudges toward /admin/billing. Owner-only: a stylist account has
  // no billing page to go to and no reason to see this.
  const showBillingBanner = isOwner && activeBusiness && !subActive && !trialActive;

  return (
    <div>
      <div className="admin-nav">
        <span className="display admin-nav-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {activeBusiness?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeBusiness.logoUrl}
              alt=""
              style={{ height: 28, width: 28, objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
            />
          )}
          Salon Admin
        </span>
        {isOwner ? (
          <AdminNav />
        ) : (
          <StylistNav
            stylistId={stylist?.id ?? ""}
            isBoothRenter={!!(stylist?.independentPayouts || stylist?.independentBilling)}
          />
        )}
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
