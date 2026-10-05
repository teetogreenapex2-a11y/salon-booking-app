import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// NOTE: this assumes your Resend API key is in the RESEND_API_KEY env var,
// the same one lib/email.ts uses for booking confirmation emails. If
// lib/email.ts uses a different env var name, change it below to match.
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // JWT sessions (NOT "database") are required here for two reasons:
  // 1) the Credentials/password provider below only works with JWT sessions
  //    — NextAuth doesn't support it with database sessions at all.
  // 2) /admin is protected by middleware.ts, which runs on Vercel's Edge
  //    runtime and can only verify a signed JWT cookie — it cannot query
  //    Postgres to check a database session row. With "database" sessions,
  //    middleware always saw "no session" and bounced back to /login even
  //    right after a successful sign-in. That was the login loop.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || "Hairsalonix <noreply@hairsalonix.com>",
      // Overrides NextAuth's default SMTP sender so it goes through Resend
      // (the same email provider already used for booking confirmations)
      // instead of requiring separate SMTP credentials.
      sendVerificationRequest: async ({ identifier, url }) => {
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "Hairsalonix <noreply@hairsalonix.com>",
          to: identifier,
          subject: "Sign in to Hairsalonix",
          html: `
            <p>Click below to sign in to Hairsalonix:</p>
            <p><a href="${url}">Sign in to Hairsalonix</a></p>
            <p style="color:#888;font-size:13px">This link expires in 24 hours. If you didn't request it, you can ignore this email.</p>
          `,
        });

        // Resend doesn't throw on failure — it returns an { error } object —
        // so without this, a failed send looks identical to a successful one
        // and shows "check your email" even though nothing was sent.
        if (error) {
          console.error("[auth] Resend failed to send sign-in email:", error);
          throw new Error(`Failed to send verification email: ${error.message}`);
        }
      },
    }),
    // Password sign-in. Only works for accounts that have a passwordHash
    // set (see scripts/hash-password.js) — everyone without one just keeps
    // using the email link above. This exists as a faster admin-only path
    // that skips the email round-trip.
    CredentialsProvider({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Temporary logging to find exactly which check is failing —
        // remove once password login is confirmed working. Shows up in
        // Vercel's Runtime Logs, never in anything the person signing in
        // can see.
        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] credentials login: missing email or password in submitted form");
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          console.error(`[auth] credentials login: no User row found for email "${credentials.email}"`);
          return null;
        }
        if (!user.passwordHash) {
          console.error(`[auth] credentials login: User "${credentials.email}" has no passwordHash set`);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          console.error(
            `[auth] credentials login: password did not match stored hash for "${credentials.email}" (hash length ${user.passwordHash.length})`
          );
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// Who is signed in as an OWNER, and whether they're the account owner
// (the person whose User row the business hangs off) or a co-owner added
// by email. Co-owners get the same full access; only the account owner can
// add or remove co-owners (see app/api/admin/co-owners).
export async function getCurrentOwnerContext() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { business: true },
  });
  if (dbUser?.business) {
    return { business: dbUser.business, isPrimary: true, email: user.email };
  }

  const member = await prisma.businessMember.findUnique({
    where: { email: user.email.toLowerCase() },
    include: { business: true },
  });
  if (member) {
    return { business: member.business, isPrimary: false, email: user.email };
  }

  return null;
}

// Use this everywhere an admin page currently does
// `prisma.business.findFirst()` — it returns the logged-in user's own
// business instead of "the" business, so each account only ever sees its
// own data. Works for the account owner and for co-owners.
export async function getCurrentBusiness() {
  return (await getCurrentOwnerContext())?.business ?? null;
}

// A stylist's login isn't a separate User-table link like an owner's —
// it's just whatever email the owner typed into Stylist.email on the
// Stylists admin page. That means a stylist can be given access before
// they've ever signed in once (no Prisma Studio step needed the way the
// owner's first login did). Matching by email also means the SAME email
// can't accidentally be both an owner and a stylist without us knowing —
// callers should check getCurrentBusiness() first and only fall back to
// this when that comes back null.
export async function getCurrentStylist() {
  const user = await getCurrentUser();
  if (!user?.email) return null;

  return prisma.stylist.findUnique({
    where: { email: user.email },
    include: { business: true },
  });
}
