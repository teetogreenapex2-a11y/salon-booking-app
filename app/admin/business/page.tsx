import { prisma } from "@/lib/prisma";
import BusinessForm from "@/components/admin/BusinessForm";

export default async function BusinessSettingsPage() {
  const business = await prisma.business.findFirst();

  if (!business) {
    return <p className="subtle">No business record found — check your seed data.</p>;
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
