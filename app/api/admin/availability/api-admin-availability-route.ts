import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Replaces all weekly availability windows for one stylist in a single
// call — simpler than diffing individual rows for a small weekly grid.
// Now also checks that the stylist actually belongs to the logged-in
// user's business before touching anything — otherwise anyone signed in
// could wipe another business's stylist's hours just by knowing their id.
export async function PUT(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { stylistId, windows } = await req.json();
  if (!stylistId || !Array.isArray(windows)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const stylist = await prisma.stylist.findFirst({
    where: { id: stylistId, businessId: business.id },
  });
  if (!stylist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.availability.deleteMany({ where: { stylistId } });
  if (windows.length > 0) {
    await prisma.availability.createMany({
      data: windows.map((w: { dayOfWeek: number; startMin: number; endMin: number }) => ({
        stylistId,
        dayOfWeek: w.dayOfWeek,
        startMin: w.startMin,
        endMin: w.endMin,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
