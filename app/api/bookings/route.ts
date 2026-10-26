import { fmtInTz } from "@/lib/tz";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { getEffectiveServiceInfo } from "@/lib/pricing";
import { payEmailBlock } from "@/lib/paymentHandles";
import { syncBookingToGoogle } from "@/lib/googleCalendar";
import { newManageToken, manageUrl } from "@/lib/manage";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessSlug, serviceId, stylistId, startsAt, customer, customerId } = body;
  const smsConsent = body.smsConsent === true;

  if (!businessSlug || !serviceId || !stylistId || !startsAt || !customer?.name || !customer?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business || business.approvalStatus !== "APPROVED") {
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

  // Deposit: if this service requires one and Stripe is connected, the
  // browser must hand back a PaymentIntent that really succeeded for the
  // right amount on the right account. Checked here, not trusted.
  let depositCents = 0;
  let depositPi: string | null = null;
  let depositAccountId: string | null = null;
  const stylistForPay = await prisma.stylist.findUnique({ where: { id: stylistId } });
  if (
    body.fromAdmin !== true &&
    info.service.depositCents > 0 &&
    business.depositsEnabled &&
    (stylistForPay?.depositsEnabled ?? true)
  ) {
    const acct = stylistForPay ? resolvePayoutAccountId(stylistForPay, business) : business.stripeConnectedAccountId;
    const enabled =
      stylistForPay && acct === stylistForPay.stripeConnectedAccountId
        ? stylistForPay.stripeChargesEnabled
        : business.stripeChargesEnabled;
    if (acct && enabled) {
      const piId = typeof body.depositPaymentIntentId === "string" ? body.depositPaymentIntentId : "";
      let ok = false;
      if (piId) {
        try {
          const pi = await stripe.paymentIntents.retrieve(piId, { stripeAccount: acct });
          ok = pi.status === "succeeded" && pi.amount === info.service.depositCents;
        } catch {}
      }
      const reused = piId ? await prisma.booking.findUnique({ where: { depositPaymentIntentId: piId } }) : null;
      // Double tap: this deposit already produced a booking — hand it back.
      if (reused && reused.customerEmail.toLowerCase() === String(customer.email).toLowerCase()) {
        return NextResponse.json(reused);
      }
      if (!ok || reused) {
        return NextResponse.json({ error: "Deposit required" }, { status: 402 });
      }
      depositCents = info.service.depositCents;
      depositPi = piId;
      depositAccountId = acct;
    }
  }
  async function refundDeposit() {
    if (!depositPi || !depositAccountId) return;
    try {
      await stripe.refunds.create({ payment_intent: depositPi }, { stripeAccount: depositAccountId });
    } catch (e) {
      console.error("[bookings] deposit auto-refund failed", e);
    }
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      stylistId,
      status: "CONFIRMED",
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
  });

  if (conflict) {
    // Same person tapping twice: hand back the booking they already made.
    if (
      conflict.startsAt.getTime() === start.getTime() &&
      conflict.customerEmail.toLowerCase() === String(customer.email).toLowerCase()
    ) {
      return NextResponse.json(conflict);
    }
    await refundDeposit();
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
      depositCents,
      depositPaymentIntentId: depositPi,
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
  const when = fmtInTz(start, business.timezone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const phone = customer.phone || customerRecord?.phone;
  if (phone && smsConsent) {
    await sendSms(phone, `Hi ${(customer.name || "").trim().split(/\s+/)[0] || "there"}! You're booked at ${business.name} for ${when}. See details, reschedule or add to calendar: ${manageLink} Msgs: 1 confirmation + 1 reminder. Msg & data rates may apply. Reply STOP to cancel, HELP for help.`).catch((err) =>
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

  await sendEmail(
    customer.email,
    `You're booked with ${business.name}`,
    `
      <p>Hi ${customer.name},</p>
      <p>You're booked with <strong>${business.name}</strong> for <strong>${when}</strong>.</p>
      <p><a href="${link}">View your appointment details</a></p>
      <p>Need to change plans? <a href="${manageLink}">Reschedule or cancel your appointment</a>.</p>${payBlock}
    `
  ).catch((err) => console.error("Booking confirmation email failed", err));

  // Tell the salon: the stylist, and the owner too if that's someone else.
  // (Skipped when the owner/stylist makes the booking themselves in admin.)
  if (body.fromAdmin !== true) {
    try {
      const owner = business.ownerId
        ? await prisma.user.findUnique({ where: { id: business.ownerId }, select: { email: true } })
        : null;
      const seen = new Set<string>();
      const recipients = [stylistRecord?.email, owner?.email]
        .map((e) => (e || "").trim())
        .filter((e) => {
          const k = e.toLowerCase();
          if (!e || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
      for (const to of recipients) {
        await sendEmail(
          to,
          `New booking: ${customer.name} — ${when}`,
          `
            <p><strong>${esc(customer.name)}</strong> just booked <strong>${esc(info.service.name)}</strong>
            with <strong>${esc(stylistRecord?.name ?? "")}</strong> for <strong>${when}</strong>.</p>
            <p>Email: ${esc(customer.email)}${customer.phone ? `<br>Phone: ${esc(customer.phone)}` : ""}</p>
            <p><a href="${origin}/admin/bookings">See it in your bookings</a></p>
          `
        ).catch((err) => console.error("Salon booking notice failed", err));
      }
    } catch (err) {
      console.error("Salon booking notice failed", err);
    }
  }

  return NextResponse.json(booking);
}
