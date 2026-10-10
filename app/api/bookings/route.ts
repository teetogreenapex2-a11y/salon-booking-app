import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { getEffectiveServiceInfo } from "@/lib/pricing";
import { payEmailBlock } from "@/lib/paymentHandles";
import { syncBookingToGoogle } from "@/lib/googleCalendar";
import { newManageToken, manageUrl } from "@/lib/manage";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessSlug, serviceId, stylistId, startsAt, customer, customerId } = body;
  const smsConsent = body.smsConsent === true;

  if (!businessSlug || !serviceId || !stylistId || !startsAt || !customer?.name || !customer?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const info = await getEffectiveServiceInfo(stylistId, serviceId);
  if (!info) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!info.offered) {
    return NextResponse.json({ error: "That stylist doesn't offer this service" }, { status: 400 });
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + info.durationMin * 60000);

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

  // Paid-up members get their plan's discount automatically.
  let priceCents = info.priceCents;
  if (customerRecord) {
    const membership = await prisma.membership.findUnique({
      where: { customerId: customerRecord.id },
      include: { plan: true },
    });
    if (membership && membership.status === "ACTIVE" && membership.paidThrough >= new Date()) {
      priceCents = Math.round((info.priceCents * (100 - membership.plan.discountPct)) / 100);
    }
  }

  const booking = await prisma.booking.create({
    data: {
      businessId: business.id,
      stylistId,
      serviceId,
      startsAt: start,
      endsAt: end,
      priceCents,
      customerId: customerRecord?.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || null,
      smsConsent,
      manageToken: newManageToken(),
    },
  });

  await syncBookingToGoogle(booking.id);

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;
  const link = `${origin}/${business.slug}/booking/${booking.id}`;
  const manageLink = manageUrl(booking.manageToken!, origin);
  const when = start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const phone = customer.phone || customerRecord?.phone;
  if (phone && smsConsent) {
    sendSms(phone, `${business.name}: You're booked for ${when}. Change or cancel: ${manageLink} Reply STOP to cancel, HELP for help.`).catch((err) =>
      console.error("Booking confirmation SMS failed", err)
    );
  }

  // Optional "pay with Venmo / Cash App / Zelle" block — empty (so the
  // email is unchanged) unless this stylist has set something up.
  const stylistRecord = await prisma.stylist.findUnique({ where: { id: stylistId } });
  const payBlock = stylistRecord
    ? payEmailBlock(
        stylistRecord,
        priceCents,
        `${info.service.name} with ${stylistRecord.name}`,
        stylistRecord.name.split(" ")[0]
      )
    : "";

  sendEmail(
    customer.email,
    `You're booked with ${business.name}`,
    `
      <p>Hi ${customer.name},</p>
      <p>You're booked with <strong>${business.name}</strong> for <strong>${when}</strong>.</p>
      <p><a href="${link}">View your appointment details</a></p>
      <p>Need to change plans? <a href="${manageLink}">Reschedule or cancel your appointment</a>.</p>${payBlock}
    `
  ).catch((err) => console.error("Booking confirmation email failed", err));

  return NextResponse.json(booking);
}
