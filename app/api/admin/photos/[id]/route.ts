import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
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
