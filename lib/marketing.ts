import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isPlaceholderEmail } from "@/lib/placeholderEmail";

const LAPSED_DAYS = 60;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function unsubSig(customerId: string) {
  return crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev")
    .update("unsub:" + customerId)
    .digest("hex")
    .slice(0, 32);
}

export function unsubUrl(customerId: string) {
  const base = process.env.APP_URL || "https://www.hairsalonix.com";
  return `${base}/unsubscribe/${customerId}/${unsubSig(customerId)}`;
}

// Customers who can be emailed: real address, not unsubscribed. LAPSED =
// has visited before but not in the last 60 days.
export async function audienceFor(businessId: string, audience: "ALL" | "LAPSED") {
  const customers = await prisma.customer.findMany({
    where: { businessId, marketingOptOut: false },
    select: { id: true, name: true, email: true },
  });
  const real = customers.filter((c: any) => !isPlaceholderEmail(c.email));
  if (audience === "ALL") return real;

  const cutoff = new Date(Date.now() - LAPSED_DAYS * 24 * 60 * 60 * 1000);
  const recent = await prisma.booking.findMany({
    where: { businessId, status: { in: ["CONFIRMED", "COMPLETED"] }, customerId: { not: null } },
    select: { customerId: true, startsAt: true },
  });
  const last = new Map<string, Date>();
  for (const b of recent as any[]) {
    const cur = last.get(b.customerId);
    if (!cur || b.startsAt > cur) last.set(b.customerId, b.startsAt);
  }
  return real.filter((c: any) => {
    const l = last.get(c.id);
    return l && l < cutoff;
  });
}

// Turns the owner's plain text into an email, with their name, address and
// the required unsubscribe link in the footer.
export function renderCampaign(opts: {
  body: string;
  customerName: string;
  customerId: string | null;
  businessName: string;
  businessAddress: string | null;
}) {
  const first = (opts.customerName || "there").split(" ")[0];
  const text = opts.body.replace(/\{name\}/gi, first);
  const paras = text
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const unsub = opts.customerId
    ? `<a href="${unsubUrl(opts.customerId)}">Unsubscribe</a>`
    : "Unsubscribe link appears here in the real email";
  return `${paras}
    <hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
    <p style="color:#888;font-size:12px">${esc(opts.businessName)}${opts.businessAddress ? " · " + esc(opts.businessAddress) : ""}<br>
    You're getting this because you booked with ${esc(opts.businessName)}. ${unsub}</p>`;
}
