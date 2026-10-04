import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Same ownership check as the stylist [id] route: confirms the service
// belongs to the logged-in user's business before allowing an update.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.service.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await req.json();
  const service = await prisma.service.update({ where: { id: params.id }, data });
  return NextResponse.json(service);
}
