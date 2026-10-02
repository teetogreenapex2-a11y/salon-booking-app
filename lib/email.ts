import { Resend } from "resend";

// Reuses the same RESEND_API_KEY and EMAIL_FROM env vars already set up
// for sign-in magic links (see lib/auth.ts) — no new env vars needed.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Hairsalonix <noreply@hairsalonix.com>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend failed to send:", error);
    return { ok: false };
  }

  return { ok: true };
}
