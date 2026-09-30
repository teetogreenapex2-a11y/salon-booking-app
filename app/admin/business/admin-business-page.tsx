import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import BusinessForm from "@/components/admin/BusinessForm";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Business settings
      </h1>
      <BusinessForm business={business} />
    </div>
  );
}
