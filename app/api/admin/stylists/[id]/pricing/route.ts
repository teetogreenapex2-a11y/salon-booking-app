import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

// Saves this stylist's per-service price/duration overrides. Body is
// { overrides: [{ serviceId, priceCents, durationMin }] } where priceCents
// and durationMin are each either a number or null (null = "use the
// business's base price/duration for this service"). A row with both
// fields null is deleted entirely rather than kept as an empty override.
//
// Two kinds of signed-in accounts can call this: the business owner
// (any of their stylists), or a stylist account editing its OWN pricing
// only — checked against the target id either way.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  let businessId: string;

  if (business) {
    businessId = business.id;
  } else {
    const stylist = await getCurrentStylist();
    if (!stylist || stylist.id !== params.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    businessId = stylist.businessId;
  }

  const stylist = await prisma.stylist.findFirst({
    where: { id: params.id, businessId },
  });
  if (!stylist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { overrides } = await req.json();
  if (!Array.isArray(overrides)) {
    return NextResponse.json({ error: "Missing overrides" }, { status: 400 });
  }

  // Only services that actually belong to this business can be overridden
  // for this stylist — ignore anything else sent.
  const businessServices = await prisma.service.findMany({
    where: { businessId },
    select: { id: true },
  });
  const validServiceIds = new Set(businessServices.map((s: { id: string }) => s.id));

  for (const o of overrides) {
    if (!validServiceIds.has(o.serviceId)) continue;

    const priceCents = o.priceCents === "" || o.priceCents === null ? null : Number(o.priceCents);
    const durationMin = o.durationMin === "" || o.durationMin === null ? null : Number(o.durationMin);

    if (priceCents === null && durationMin === null) {
      await prisma.stylistService.deleteMany({
        where: { stylistId: stylist.id, serviceId: o.serviceId },
      });
      continue;
    }

    await prisma.stylistService.upsert({
      where: { stylistId_serviceId: { stylistId: stylist.id, serviceId: o.serviceId } },
      update: { priceCents, durationMin },
      create: { stylistId: stylist.id, serviceId: o.serviceId, priceCents, durationMin },
    });
  }

  return NextResponse.json({ ok: true });
}
