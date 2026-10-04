import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Request a password reset link. Reuses NextAuth's own VerificationToken
// table (already in the schema for magic-link sign-in) instead of adding a
// new one — the "reset:" prefix on identifier keeps these tokens separate
// from sign-in link tokens for the same email, so neither can be used in
// place of the other.
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always return the same response whether or not the email has an
  // account — otherwise this endpoint could be used to check which emails
  // are registered.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    return genericResponse;
  }

  const identifier = `reset:${cleanEmail}`;

  // Clear out any earlier unused reset tokens for this email first, so
  // only the most recently requested link works.
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  const origin = req.headers.get("origin") || `https://${process.env.VERCEL_URL}`;
  const link = `${origin}/login/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${token}`;

  await sendEmail(
    cleanEmail,
    "Reset your Hairsalonix password",
    `
      <p>Click below to set a new password:</p>
      <p><a href="${link}">Reset your password</a></p>
      <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't be changed.</p>
    `
  );

  return genericResponse;
}
