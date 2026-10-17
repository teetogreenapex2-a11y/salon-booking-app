import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Emails allowed to approve new salons. Set PLATFORM_ADMIN_EMAILS in Vercel
// (comma separated) to change; otherwise the owner's two emails are used.
export function platformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS || "teetogreenapex2@gmail.com,rcstitz52@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPlatformAdminEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  return email && platformAdminEmails().includes(email) ? email : null;
}
