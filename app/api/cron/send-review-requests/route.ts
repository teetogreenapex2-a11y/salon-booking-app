import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/placeholderEmail";

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Runs once a day (see vercel.json). For salons that set a review link,
// emails each customer ONCE after a visit that ended 3-48 hours ago, and
// never more than one request per customer per 30 days.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      reviewRequestedAt: null,
      endsAt: { gte: new Date(now - 48 * HOUR), lte: new Date(now - 3 * HOUR) },
      business: { reviewUrl: { not: null } },
    },
    include: { business: true, service: true, stylist: true },
  });

  let sent = 0;
  let skipped = 0;
  const handledThisRun = new Set<string>();

  for (const booking of bookings) {
    const reviewUrl = booking.business.reviewUrl;
    const email = booking.customerEmail.toLowerCase();
    const key = `${booking.businessId}:${email}`;

    if (!reviewUrl || isPlaceholderEmail(email) || handledThisRun.has(key)) {
      skipped++;
      continue;
    }

    // At most one request per customer per salon every 30 days.
    const recent = await prisma.booking.findFirst({
      where: {
        businessId: booking.businessId,
        customerEmail: { equals: booking.customerEmail, mode: "insensitive" },
        reviewRequestedAt: { gte: new Date(now - 30 * 24 * HOUR) },
      },
      select: { id: true },
    });
    if (recent) {
      // Mark this visit as handled so it is not reconsidered tomorrow.
      await prisma.booking.update({ where: { id: booking.id }, data: { reviewRequestedAt: new Date() } });
      skipped++;
      continue;
    }

    const first = booking.customerName.split(" ")[0] || "there";
    const result = await sendEmail(
      booking.customerEmail,
      `How was your visit with ${booking.business.name}?`,
      `
        <p>Hi ${esc(first)},</p>
        <p>Thanks for visiting <strong>${esc(booking.business.name)}</strong>. We hope you loved your
        ${esc(booking.service.name)} with ${esc(booking.stylist.name)}.</p>
        <p>If you have a minute, a quick review helps a small business a lot:</p>
        <p><a href="${esc(reviewUrl)}" style="display:inline-block;padding:12px 22px;background:#7f2d4a;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Leave a review</a></p>
        <p style="color:#777;font-size:12px">You're getting this once after your visit. Reply to this email if you'd rather not hear from us.</p>
      `
    );

    if (result.ok) {
      await prisma.booking.update({ where: { id: booking.id }, data: { reviewRequestedAt: new Date() } });
      handledThisRun.add(key);
      sent++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, checked: bookings.length });
}
