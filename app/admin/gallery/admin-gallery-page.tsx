import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import GalleryManager from "@/components/GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGallery() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

  const photos = await prisma.photo.findMany({
    where: { businessId: business.id },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Gallery
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Photos shown on your public booking page
      </p>
      <GalleryManager initialPhotos={photos} />
    </div>
  );
}
