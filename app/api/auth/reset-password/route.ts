import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Completes a password reset: checks the token matches, hasn't expired,
// and hasn't already been used (it's deleted the moment it's used), then
// sets the new password hash directly — same bcrypt setup
// scripts/hash-password.js uses, just done server-side instead of by hand
// in Prisma Studio.
export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !token || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const identifier = `reset:${cleanEmail}`;

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    return NextResponse.json({ error: "No account found for that email" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // One-time use — delete it the moment it's successfully used, so the
    // same email link can't be replayed to reset the password again.
    prisma.verificationToken.delete({ where: { identifier_token: { identifier, token } } }),
  ]);

  return NextResponse.json({ ok: true });
}
