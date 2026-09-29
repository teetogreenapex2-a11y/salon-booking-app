import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, address, accountType, yourName } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Business name and web address are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.business.findUnique({ where: { ownerId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "You already have a business set up" }, { status: 409 });
  }

  const cleanSlug = String(slug)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const slugTaken = await prisma.business.findUnique({ where: { slug: cleanSlug } });
  if (slugTaken) {
    return NextResponse.json({ error: "That web address is already taken — try another" }, { status: 409 });
  }

  const business = await prisma.business.create({
    data: {
      name,
      slug: cleanSlug,
      address: address || null,
      ownerId: user.id,
    },
  });

  // An independent stylist is their own business with themselves as the
  // one (and usually only) stylist, so they land on a normal-looking
  // calendar/booking setup right away instead of an empty stylist list.
  if (accountType === "independent") {
    await prisma.stylist.create({
      data: {
        businessId: business.id,
        name: yourName || name,
      },
    });
  }

  return NextResponse.json(business);
}
