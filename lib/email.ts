import { Resend } from "resend";
import { isPlaceholderEmail } from "@/lib/placeholderEmail";

// Reuses the same RESEND_API_KEY and EMAIL_FROM env vars already set up
// for sign-in magic links (see lib/auth.ts) — no new env vars needed.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  // Walk-ins with no email get a private placeholder; never try to mail it.
  if (!to || isPlaceholderEmail(to)) return { ok: true };
  // Never let a slow provider hold up the customer's booking.
  const result = await Promise.race([
    resend.emails.send({
      from: process.env.EMAIL_FROM || "Hairsalonix <noreply@hairsalonix.com>",
      to,
      subject,
      html,
    }),
    new Promise<{ error: unknown }>((resolve) => setTimeout(() => resolve({ error: "timed out after 8s" }), 8000)),
  ]);
  const error = (result as { error?: unknown }).error;

  if (error) {
    console.error("[email] Resend failed to send:", error);
    return { ok: false };
  }

  return { ok: true };
}
