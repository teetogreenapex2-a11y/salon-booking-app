import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStylist } from "@/lib/auth";
import { cleanHandle, cleanZelle, HANDLE_ERROR } from "@/lib/paymentHandles";

// Lets a signed-in stylist set their OWN Venmo / Cash App / Zelle details
// (the owner can also set them from the Stylists page).
export async function PUT(req: NextRequest) {
  const stylist = await getCurrentStylist();
  if (!stylist) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const venmo = cleanHandle(body.venmoHandle);
  const cashApp = cleanHandle(body.cashAppHandle);
  if (!venmo.ok || !cashApp.ok) {
    return NextResponse.json({ error: HANDLE_ERROR }, { status: 400 });
  }

  const updated = await prisma.stylist.update({
    where: { id: stylist.id },
    data: {
      venmoHandle: venmo.value,
      cashAppHandle: cashApp.value,
      zelleInfo: cleanZelle(body.zelleInfo),
    },
  });
  return NextResponse.json({
    venmoHandle: updated.venmoHandle,
    cashAppHandle: updated.cashAppHandle,
    zelleInfo: updated.zelleInfo,
  });
}
