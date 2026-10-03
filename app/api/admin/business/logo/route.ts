import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { put } from "@vercel/blob";

// Uploads a logo image for the LOGGED-IN user's own business and saves its
// URL straight onto Business.logoUrl — one step, no separate "save" click.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "No business set up" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const blob = await put(`logo/${business.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { logoUrl: blob.url },
  });

  return NextResponse.json({ logoUrl: updated.logoUrl });
}

// Removes the current logo (clears the field — the old blob file is simply
// left orphaned in storage, same tradeoff the photo gallery delete makes).
export async function DELETE() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "No business set up" }, { status: 400 });
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { logoUrl: null },
  });

  return NextResponse.json({ ok: true });
}
