import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json([]);

  const photos = await prisma.photo.findMany({
    where: { businessId: business.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(photos);
}

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
    blob = await put(`gallery/${business.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
  } catch (err) {
    // Without this, a missing/misconfigured Vercel Blob store (no
    // BLOB_READ_WRITE_TOKEN, store not connected to this project, etc.)
    // throws here and the request just 500s with no detail — looks from
    // the Gallery page like the upload silently did nothing.
    console.error("[admin/photos] blob upload failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Couldn't upload the photo — ${detail}` },
      { status: 500 }
    );
  }

  const count = await prisma.photo.count({ where: { businessId: business.id } });

  const photo = await prisma.photo.create({
    data: {
      businessId: business.id,
      url: blob.url,
      order: count,
    },
  });

  return NextResponse.json(photo);
}
