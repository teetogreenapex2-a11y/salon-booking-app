import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// businessId now always comes from the logged-in user's own business, never
// from the request body — same fix as the stylists route.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { name, durationMin, priceCents } = await req.json();
  if (!name || !durationMin || !priceCents) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: { businessId: business.id, name, durationMin, priceCents },
  });
  // Stylists set to "only their own services" don't get the standard menu.
  const ownOnly = await prisma.stylist.findMany({
    where: { businessId: business.id, ownServicesOnly: true },
    select: { id: true },
  });
  if (ownOnly.length > 0) {
    await prisma.stylistService.createMany({
      data: ownOnly.map((o) => ({ stylistId: o.id, serviceId: service.id, priceCents: 0 })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json(service);
}
