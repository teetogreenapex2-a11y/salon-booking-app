import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Replaces all weekly availability windows for one stylist in a single
// call — simpler than diffing individual rows for a small weekly grid.
export async function PUT(req: NextRequest) {
  const { stylistId, windows } = await req.json();
  if (!stylistId || !Array.isArray(windows)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
