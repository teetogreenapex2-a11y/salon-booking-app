import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

// A stylist (with the owner's "Can add new services" permission) adds a new
// service to the shared menu. To keep it from suddenly appearing on every
// other stylist's booking page, it starts hidden for everyone else (the
// same "$0 override = I don't do this" mechanism the pricing page uses);
// the owner can switch it on for others from their pricing pages.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  let businessId: string;

  if (business) {
    businessId = business.id;
  } else {
    const me = await getCurrentStylist();
    if (!me || me.id !== params.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    if (!me.canAddServices) {
      return NextResponse.json(
        { error: "The salon owner hasn't turned on adding services for your account." },
        { status: 403 }
      );
    }
    businessId = me.businessId;
  }

  const stylist = await prisma.stylist.findFirst({ where: { id: params.id, businessId } });
  if (!stylist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const name = String(body.name ?? "").trim().slice(0, 80);
  const durationMin = Math.round(Number(body.durationMin));
  const priceCents = Math.round(Number(body.price) * 100);
  if (!name || !(durationMin >= 5 && durationMin <= 600) || !(priceCents > 0 && priceCents < 10_000_000)) {
    return NextResponse.json({ error: "Enter a name, a price above $0, and a duration in minutes." }, { status: 400 });
  }

  const others = await prisma.stylist.findMany({
    where: { businessId, id: { not: stylist.id } },
    select: { id: true },
  });

  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({ data: { businessId, name, durationMin, priceCents, ownerStylistId: stylist.id } });
    if (others.length > 0) {
      await tx.stylistService.createMany({
        data: others.map((o) => ({ stylistId: o.id, serviceId: created.id, priceCents: 0 })),
      });
    }
    return created;
  });

  return NextResponse.json(service);
}
