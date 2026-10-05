import { requireOwner } from "@/lib/access";
import { getCurrentOwnerContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CoOwnerManager from "@/components/admin/CoOwnerManager";
import BusinessForm from "@/components/admin/BusinessForm";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const business = await requireOwner();
  const ctx = await getCurrentOwnerContext();

  const [owner, members] = await Promise.all([
    business.ownerId ? prisma.user.findUnique({ where: { id: business.ownerId } }) : null,
    prisma.businessMember.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Business settings
      </h1>
      <BusinessForm business={business} />

      <CoOwnerManager
        ownerEmail={owner?.email ?? ""}
        initialMembers={members.map((m) => ({ id: m.id, email: m.email }))}
        canManage={!!ctx?.isPrimary}
      />
    </div>
  );
}
