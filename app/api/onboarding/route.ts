import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { platformAdminEmails } from "@/lib/platform";
import { starterServices } from "@/lib/starterServices";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, address, accountType, yourName } = body;
  const kind = typeof body.kind === "string" ? body.kind : "";

  if (!name || !slug) {
    return NextResponse.json({ error: "Business name and web address are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const asMember = await prisma.businessMember.findUnique({
    where: { email: user.email.toLowerCase() },
  });
  if (asMember) {
    return NextResponse.json(
      { error: "You've been added as a co-owner of an existing business — just go to your dashboard." },
      { status: 409 }
    );
  }

  const existing = await prisma.business.findUnique({ where: { ownerId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "You already have a business set up" }, { status: 409 });
  }

  const cleanSlug = String(slug)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const slugTaken = await prisma.business.findUnique({ where: { slug: cleanSlug } });
  if (slugTaken) {
    return NextResponse.json({ error: "That web address is already taken — try another" }, { status: 409 });
  }

  const business = await prisma.business.create({
    data: {
      name,
      slug: cleanSlug,
      address: address || null,
      ownerId: user.id,
      // Needs the platform owner's OK before it can be used or booked.
      approvalStatus: "PENDING",
      listed: false,
      quickStart: true,
      // 14-day free trial starting now, so a new signup can use the app
      // immediately without hitting a paywall — the admin layout only
      // nudges toward /admin/billing once this passes with no subscription.
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // An independent stylist is their own business with themselves as the
  // one (and usually only) stylist, so they land on a normal-looking
  // calendar/booking setup right away instead of an empty stylist list.
  if (accountType === "independent") {
    const me = await prisma.stylist.create({
      data: {
        businessId: business.id,
        name: yourName || name,
      },
    });
    // Starting hours, Tuesday to Saturday 9–5, so they're bookable straight
    // away. Easy to change on the Hours page.
    await prisma.availability.createMany({
      data: [2, 3, 4, 5, 6].map((d) => ({ stylistId: me.id, dayOfWeek: d, startMin: 9 * 60, endMin: 17 * 60 })),
    });
  }

  // Starter menu for what they do, so the booking page isn't empty.
  const starter = starterServices(kind);
  if (starter.length > 0) {
    await prisma.service.createMany({
      data: starter.map((s) => ({ ...s, businessId: business.id })),
    });
  }

  // Tell the platform owner there is someone waiting for approval.
  try {
    const admins = platformAdminEmails();
    if (admins[0]) {
      await sendEmail(
        admins[0],
        `New Hairsalonix signup waiting for approval: ${name}`,
        `<p><strong>${String(name).replace(/</g, "&lt;")}</strong> (${user.email}) just signed up.</p>` +
          `<p><a href="https://www.hairsalonix.com/platform">Review and approve</a></p>`
      );
    }
  } catch (e) {
    console.error("[onboarding] approval email failed", e);
  }

  return NextResponse.json(business);
}
