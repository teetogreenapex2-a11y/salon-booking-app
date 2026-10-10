import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { dollarsToCents, uniqueCode } from "@/lib/giftCards";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const cents = dollarsToCents(b.amount);
  if (!(cents >= 100 && cents <= 100000)) {
    return NextResponse.json({ error: "Enter an amount between $1 and $1,000." }, { status: 400 });
  }
  const card = await prisma.giftCard.create({
    data: {
      businessId: business.id,
      code: await uniqueCode(),
      initialCents: cents,
      balanceCents: cents,
      recipientName: b.recipientName ? String(b.recipientName).trim().slice(0, 100) : null,
      purchaserName: b.purchaserName ? String(b.purchaserName).trim().slice(0, 100) : null,
      note: b.note ? String(b.note).trim().slice(0, 300) : null,
    },
  });

  const to = String(b.recipientEmail || "").trim();
  if (/^\S+@\S+\.\S+$/.test(to)) {
    const from = card.purchaserName ? ` from ${esc(card.purchaserName)}` : "";
    sendEmail(
      to,
      `Your ${business.name} gift card`,
      `<p>Hi${card.recipientName ? " " + esc(card.recipientName) : ""},</p>
       <p>You've received a <strong>$${(cents / 100).toFixed(2)}</strong> gift card${from} for ${esc(business.name)}.</p>
       ${card.note ? `<p><em>${esc(card.note)}</em></p>` : ""}
       <p style="font-size:22px;letter-spacing:2px"><strong>${card.code}</strong></p>
       <p>Book at <a href="${process.env.APP_URL || "https://www.hairsalonix.com"}/${business.slug}">your salon's page</a> and give this code when you pay.</p>`
    ).catch((e) => console.error("Gift card email failed", e));
  }
  return NextResponse.json({ ok: true, code: card.code });
}
