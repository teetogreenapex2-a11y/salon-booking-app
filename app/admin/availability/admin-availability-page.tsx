import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import AvailabilityManager from "@/components/admin/AvailabilityManager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  const stylists = await prisma.stylist.findMany({
    where: { businessId: business.id, active: true },
    include: { availability: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 20 }}>
        Hours
      </h1>
      <AvailabilityManager stylists={stylists} />
    </div>
  );
}
