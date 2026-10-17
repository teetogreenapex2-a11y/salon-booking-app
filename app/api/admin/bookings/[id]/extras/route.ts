import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import { getEffectiveServiceInfo } from "@/lib/pricing";

async function loadBooking(id: string) {
  const business = await getCurrentBusiness();
  const stylist = business ? null : await getCurrentStylist();
  if (!business && !stylist) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const booking = await prisma.booking.findFirst({
    where: business ? { id, businessId: business.id } : { id, stylistId: stylist!.id },
  });
  if (!booking) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (booking.paidOutsideAt) {
    return { error: NextResponse.json({ error: "This booking is marked paid — undo the payment first." }, { status: 400 }) };
  }
  return { booking };
}

// Adds a service to a client's bill, by scanned code or by picking it.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await loadBooking(params.id);
  if (r.error) return r.error;
  const booking = r.booking!;

  const { code, serviceId } = await req.json().catch(() => ({}));
  const service = await prisma.service.findFirst({
    where: code
      ? { businessId: booking.businessId, barcode: String(code).trim(), active: true }
      : { businessId: booking.businessId, id: String(serviceId || ""), active: true },
  });
  if (!service) return NextResponse.json({ error: "No service matches that code." }, { status: 404 });

  const info = await getEffectiveServiceInfo(booking.stylistId, service.id);
  if (!info || !info.offered) {
    return NextResponse.json({ error: "This stylist doesn't offer that service." }, { status: 400 });
  }

  const extra = await prisma.$transaction(async (tx: any) => {
    const created = await tx.bookingExtra.create({
      data: { bookingId: booking.id, serviceId: service.id, name: service.name, priceCents: info.priceCents },
    });
    await tx.booking.update({ where: { id: booking.id }, data: { priceCents: { increment: info.priceCents } } });
    return created;
  });
  return NextResponse.json(extra);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await loadBooking(params.id);
  if (r.error) return r.error;
  const booking = r.booking!;
  const extraId = new URL(req.url).searchParams.get("extraId") || "";
  const extra = await prisma.bookingExtra.findFirst({ where: { id: extraId, bookingId: booking.id } });
  if (!extra) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.bookingExtra.delete({ where: { id: extra.id } }),
    prisma.booking.update({ where: { id: booking.id }, data: { priceCents: { decrement: extra.priceCents } } }),
  ]);
  return NextResponse.json({ ok: true });
}
