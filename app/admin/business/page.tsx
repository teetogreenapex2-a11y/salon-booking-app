import { requireOwner } from "@/lib/access";
import BusinessForm from "@/components/admin/BusinessForm";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const business = await requireOwner();

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Business settings
      </h1>
      <BusinessForm business={business} />
    </div>
  );
}
