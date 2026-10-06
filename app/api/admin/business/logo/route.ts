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

  let blob;
  try {
    blob = await put(`logo/${business.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
  } catch (err) {
    console.error("Logo upload failed", err);
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      {
        error: /token/i.test(msg)
          ? "File storage isn't connected yet (missing Vercel Blob token), so the logo couldn't be saved."
          : "The logo couldn't be saved — try again.",
      },
      { status: 500 }
    );
  }

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
