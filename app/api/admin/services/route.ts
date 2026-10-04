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
  return NextResponse.json(service);
}
