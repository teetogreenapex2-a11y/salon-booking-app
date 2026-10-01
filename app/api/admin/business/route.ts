import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Updates the LOGGED-IN user's own business only — the id always comes
// from the session, never from the request body.
export async function PUT(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { name, tagline, address, instagram, timezone, noShowFeeCents } = await req.json();
  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      name,
      tagline,
      address,
      instagram,
      timezone,
      ...(typeof noShowFeeCents === "number" ? { noShowFeeCents } : {}),
    },
  });
  return NextResponse.json(updated);
}
