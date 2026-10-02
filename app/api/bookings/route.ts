import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessSlug, serviceId, stylistId, startsAt, customer, customerId } = body;

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

  // customerId is passed in once the card-on-file step has already
  // created/found the Customer row; otherwise upsert one now. Every
  // booking should end up linked to a Customer record — booking history,
  // no-show tracking, and repeat-customer lookups all depend on it.
  const customerRecord = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : await prisma.customer.upsert({
        where: { businessId_email: { businessId: business.id, email: customer.email } },
        update: { name: customer.name, phone: customer.phone || undefined },
        create: {
          businessId: business.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
        },
      });

  const booking = await prisma.booking.create({
    data: {
      businessId: business.id,
      stylistId,
      serviceId,
      startsAt: start,
      endsAt: end,
      customerId: customerRecord?.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || null,
    },
  });

  // Fire the confirmation text and email — never let either failure fail
  // the booking itself.
  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;
  const link = `${origin}/${business.slug}/booking/${booking.id}`;
  const when = start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const phone = customer.phone || customerRecord?.phone;
  if (phone) {
    sendSms(phone, `${business.name}: You're booked for ${when}. Details: ${link}`).catch((err) =>
      console.error("Booking confirmation SMS failed", err)
    );
  }

  sendEmail(
    customer.email,
    `You're booked with ${business.name}`,
    `
      <p>Hi ${customer.name},</p>
      <p>You're booked with <strong>${business.name}</strong> for <strong>${when}</strong>.</p>
      <p><a href="${link}">View your appointment details</a></p>
    `
  ).catch((err) => console.error("Booking confirmation email failed", err));

  return NextResponse.json(booking);
}
