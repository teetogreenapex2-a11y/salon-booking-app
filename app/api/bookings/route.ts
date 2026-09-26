import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessSlug, serviceId, stylistId, startsAt, customer } = body;

  if (!businessSlug || !serviceId || !stylistId || !startsAt || !customer?.name || !customer?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });

  if (!business || !service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + service.durationMin * 60000);

  // Guard against a double-book race: reject if anything now overlaps.
  const conflict = await prisma.booking.findFirst({
    where: {
      stylistId,
      status: "CONFIRMED",
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      businessId: business.id,
      stylistId,
      serviceId,
      startsAt: start,
      endsAt: end,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || null,
    },
  });

  // TODO: Stripe Connect deposit charge goes here, same pattern as
  // BookMyPro's webhook infra — create a PaymentIntent on the connected
  // account and store stripePaymentIntentId on the booking.

  // TODO: confirmation email/SMS + push to stylist, same as BookMyPro's
  // 7am daily schedule cron pattern but fired on booking creation instead.

  return NextResponse.json(booking);
}
