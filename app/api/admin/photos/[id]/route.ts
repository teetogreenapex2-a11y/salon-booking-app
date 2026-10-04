import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { getCurrentBusiness } from "@/lib/auth";

// Checks the photo belongs to the logged-in user's business before
// deleting — this previously had no check at all, so anyone (even
// signed out) who knew or guessed a photo id could delete any business's
// gallery photo.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.photo.delete({ where: { id: params.id } });

  try {
    await del(photo.url);
  } catch (err) {
    console.error("Failed to delete blob:", err);
  }

  return NextResponse.json({ ok: true });
}
