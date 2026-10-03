import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

// Replaces all weekly availability windows for one stylist in a single
// call — simpler than diffing individual rows for a small weekly grid.
//
// Allows two kinds of signed-in accounts to call this: the business owner
// (can edit any of their stylists' hours), or a stylist account editing
// its OWN hours only. Either way we check the target stylistId actually
// belongs to the caller before touching anything.
export async function PUT(req: NextRequest) {
  const { stylistId, windows } = await req.json();
  if (!stylistId || !Array.isArray(windows)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const business = await getCurrentBusiness();
  if (business) {
    const stylist = await prisma.stylist.findFirst({
      where: { id: stylistId, businessId: business.id },
    });
    if (!stylist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const stylist = await getCurrentStylist();
    if (!stylist || stylist.id !== stylistId) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
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
