import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOwnerContext } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Adds a co-owner by email. Only the account owner can do this — a
// co-owner gets full access to everything else, but can't add or remove
// other owners (so one partner can't lock the other out).
export async function POST(req: NextRequest) {
  const ctx = await getCurrentOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!ctx.isPrimary) {
    return NextResponse.json({ error: "Only the account owner can add co-owners." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (email === ctx.email.toLowerCase()) {
    return NextResponse.json({ error: "That's your own email — you're already the owner." }, { status: 400 });
  }

  const existingMember = await prisma.businessMember.findUnique({ where: { email } });
  if (existingMember) {
    return NextResponse.json(
      {
        error:
          existingMember.businessId === ctx.business.id
            ? "That person is already a co-owner."
            : "That email is already a co-owner of another business.",
      },
      { status: 409 }
    );
  }

  // Someone who already runs their own Hairsalonix business can't also
  // co-own this one — a login only ever opens one business.
  const theirUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { business: true },
  });
  if (theirUser?.business) {
    return NextResponse.json(
      { error: "That person already has their own Hairsalonix business, so they can't also co-own this one." },
      { status: 409 }
    );
  }

  const member = await prisma.businessMember.create({
    data: { businessId: ctx.business.id, email },
  });

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;
  sendEmail(
    email,
    `You've been added as a co-owner of ${ctx.business.name}`,
    `
      <p>Hi,</p>
      <p>${escapeHtml(ctx.email)} added you as a co-owner of <strong>${escapeHtml(ctx.business.name)}</strong> on Hairsalonix.</p>
      <p>Sign in with this email address (${escapeHtml(email)}) and you'll land straight on the shared dashboard:</p>
      <p><a href="${origin}/login">${origin}/login</a></p>
    `
  ).catch((err) => console.error("Co-owner invite email failed", err));

  return NextResponse.json({ id: member.id, email: member.email });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getCurrentOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!ctx.isPrimary) {
    return NextResponse.json({ error: "Only the account owner can remove co-owners." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const member = await prisma.businessMember.findFirst({
    where: { id: String(body.id ?? ""), businessId: ctx.business.id },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.businessMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}
