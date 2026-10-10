import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOwnerContext } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { audienceFor, renderCampaign } from "@/lib/marketing";

export const maxDuration = 60;

const MAX_RECIPIENTS = 500;

export async function POST(req: NextRequest) {
  const ctx = await getCurrentOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const business = ctx.business;

  const b = await req.json().catch(() => ({}));
  const subject = String(b.subject || "").trim().slice(0, 150);
  const body = String(b.body || "").trim().slice(0, 5000);
  const audience = b.audience === "LAPSED" ? "LAPSED" : "ALL";
  if (!subject || !body) {
    return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
  }

  // Test send: one copy to the owner, nothing recorded.
  if (b.test) {
    await sendEmail(
      ctx.email,
      `[Test] ${subject}`,
      renderCampaign({ body, customerName: "Alex", customerId: null, businessName: business.name, businessAddress: business.address })
    );
    return NextResponse.json({ ok: true, test: true });
  }

  if (!business.address) {
    return NextResponse.json(
      { error: "Add your salon's address on the Business page first — marketing emails must include it." },
      { status: 400 }
    );
  }

  const recent = await prisma.campaign.findFirst({
    where: { businessId: business.id, createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
  });
  if (recent) {
    return NextResponse.json({ error: "You sent a campaign in the last 12 hours — wait a bit before the next one." }, { status: 429 });
  }

  const people = await audienceFor(business.id, audience);
  if (people.length === 0) return NextResponse.json({ error: "No customers match that audience." }, { status: 400 });
  if (people.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `That's ${people.length} people — the limit is ${MAX_RECIPIENTS} per send.` }, { status: 400 });
  }

  // Record first so a double-click can't send twice.
  const campaign = await prisma.campaign.create({
    data: { businessId: business.id, subject, body, audience },
  });

  let sent = 0;
  for (let i = 0; i < people.length; i += 10) {
    const chunk = people.slice(i, i + 10);
    const results = await Promise.all(
      chunk.map((c: any) =>
        sendEmail(
          c.email,
          subject,
          renderCampaign({ body, customerName: c.name, customerId: c.id, businessName: business.name, businessAddress: business.address })
        ).catch(() => ({ ok: false }))
      )
    );
    sent += results.filter((r) => r.ok).length;
  }
  await prisma.campaign.update({ where: { id: campaign.id }, data: { sentCount: sent } });
  return NextResponse.json({ ok: true, sent });
}
