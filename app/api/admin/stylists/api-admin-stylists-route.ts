import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// businessId now always comes from the logged-in user's own business, never
// from the request body — otherwise anyone signed in could create a stylist
// under any business by passing a different businessId.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { name, specialty } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const stylist = await prisma.stylist.create({
    data: { businessId: business.id, name, specialty: specialty || null },
  });
  return NextResponse.json(stylist);
}
