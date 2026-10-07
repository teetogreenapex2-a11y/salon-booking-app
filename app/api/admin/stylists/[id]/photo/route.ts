import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import { put } from "@vercel/blob";

async function allowed(stylistId: string) {
  const business = await getCurrentBusiness();
  if (business) return prisma.stylist.findFirst({ where: { id: stylistId, businessId: business.id } });
  const me = await getCurrentStylist();
  return me && me.id === stylistId ? me : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const stylist = await allowed(params.id);
  if (!stylist) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  let blob;
  try {
    blob = await put(`stylist/${stylist.id}/${Date.now()}-${file.name}`, file, { access: "public" });
  } catch (err) {
    console.error("Stylist photo upload failed", err);
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      {
        error: /token/i.test(msg)
          ? "File storage isn't connected yet (missing Vercel Blob token), so the photo couldn't be saved."
          : "The photo couldn't be saved — try again.",
      },
      { status: 500 }
    );
  }

  const updated = await prisma.stylist.update({ where: { id: stylist.id }, data: { photoUrl: blob.url } });
  return NextResponse.json({ photoUrl: updated.photoUrl });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const stylist = await allowed(params.id);
  if (!stylist) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await prisma.stylist.update({ where: { id: stylist.id }, data: { photoUrl: null } });
  return NextResponse.json({ ok: true });
}
