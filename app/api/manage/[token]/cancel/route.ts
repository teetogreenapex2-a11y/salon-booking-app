import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { syncBookingToGoogle } from "@/lib/googleCalendar";
import { bookingByToken } from "@/lib/manageBooking";
import { notifyWaitlist } from "@/lib/waitlist";
import { changeStatus, formatWhen } from "@/lib/manage";
import { stripe, resolvePayoutAccountId } from "@/lib/stripe";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await bookingByToken(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const state = changeStatus(booking, booking.business.cancelCutoffHours);
  if (state === "closed") {
    return NextResponse.json({ error: "This appointment can't be changed anymore." }, { status: 400 });
  }
  if (state === "too_late") {
    return NextResponse.json(
      { error: `Cancellations close ${booking.business.cancelCutoffHours} hours before your appointment — please contact ${booking.business.name}.` },
      { status: 400 }
    );
  }

  // Cancelled inside the salon's cancellation window: give the deposit back.
  let refunded = false;
  if (booking.depositPaymentIntentId && booking.depositCents > 0 && !booking.depositRefundedAt) {
    try {
      const acct = resolvePayoutAccountId(booking.stylist, booking.business);
      if (acct) {
        await stripe.refunds.create({ payment_intent: booking.depositPaymentIntentId }, { stripeAccount: acct });
        refunded = true;
      }
    } catch (e) {
      console.error("[cancel] deposit refund failed", e);
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", ...(refunded ? { depositRefundedAt: new Date() } : {}) },
  });
  await syncBookingToGoogle(booking.id);
  await notifyWaitlist(booking.id);

  const when = formatWhen(booking.startsAt, booking.business.timezone);

  await sendEmail(
    booking.customerEmail,
    `Your appointment with ${booking.business.name} was cancelled`,
    `<p>Hi ${booking.customerName},</p>
     <p>Your <strong>${booking.service.name}</strong> appointment on <strong>${when}</strong> has been cancelled.${refunded ? ` Your $${(booking.depositCents / 100).toFixed(2)} deposit is being refunded to your card (allow 5–10 business days).` : ""} You can book again any time.</p>`
  ).catch((e) => console.error("Cancel email failed", e));

  if (booking.stylist.email) {
    await sendEmail(
      booking.stylist.email,
      `${booking.customerName} cancelled`,
      `<p>${booking.customerName} cancelled their ${booking.service.name} on <strong>${when}</strong>. That time is open again.</p>`
    ).catch((e) => console.error("Stylist cancel email failed", e));
  }

  return NextResponse.json({ ok: true });
}
