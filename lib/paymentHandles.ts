// Shared helpers for the optional "pay outside the app" handles
// (Venmo / Cash App / Zelle). Pure functions — safe to use from server
// code, client components, and email templates alike.

const HANDLE_RE = /^[A-Za-z0-9._-]{1,40}$/;

export type CleanResult = { ok: true; value: string | null } | { ok: false };

// Strips a leading @ or $ and checks the rest only uses characters those
// services allow, so a handle can never break out of a URL or an email.
export function cleanHandle(raw: unknown): CleanResult {
  const cleaned = String(raw ?? "").trim().replace(/^[@$]+/, "");
  if (!cleaned) return { ok: true, value: null };
  if (!HANDLE_RE.test(cleaned)) return { ok: false };
  return { ok: true, value: cleaned };
}

export function cleanZelle(raw: unknown): string | null {
  return String(raw ?? "").trim().slice(0, 80) || null;
}

export const HANDLE_ERROR =
  "Handles can only use letters, numbers, dots, dashes and underscores.";

// When the amount is 0 or unknown the link just opens the person's
// profile and the customer types the amount themselves.
export function venmoUrl(handle: string, amountCents: number, note: string) {
  const base = `https://venmo.com/${encodeURIComponent(handle)}`;
  if (amountCents <= 0) return base;
  return `${base}?txn=pay&amount=${(amountCents / 100).toFixed(2)}&note=${encodeURIComponent(note)}`;
}

export function cashAppUrl(handle: string, amountCents: number) {
  const base = `https://cash.app/$${encodeURIComponent(handle)}`;
  if (amountCents <= 0) return base;
  return `${base}/${(amountCents / 100).toFixed(2)}`;
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PayHandles = {
  venmoHandle: string | null;
  cashAppHandle: string | null;
  zelleInfo: string | null;
};

export function hasAnyHandle(h: PayHandles) {
  return !!(h.venmoHandle || h.cashAppHandle || h.zelleInfo);
}

// A small HTML block for the booking confirmation email. Returns "" when
// the stylist hasn't set anything up, so the email is unchanged for them.
export function payEmailBlock(h: PayHandles, amountCents: number, note: string, stylistFirstName: string) {
  if (!hasAnyHandle(h)) return "";
  const links: string[] = [];
  if (h.venmoHandle) {
    links.push(`<a href="${escapeHtml(venmoUrl(h.venmoHandle, amountCents, note))}">Pay with Venmo</a>`);
  }
  if (h.cashAppHandle) {
    links.push(`<a href="${escapeHtml(cashAppUrl(h.cashAppHandle, amountCents))}">Pay with Cash App</a>`);
  }
  if (h.zelleInfo) {
    links.push(`Zelle: ${escapeHtml(h.zelleInfo)}`);
  }
  return `
      <p style="margin-top:18px"><strong>Prefer to pay ${escapeHtml(stylistFirstName)} with Venmo, Cash App or Zelle?</strong><br/>
      ${links.join(" &nbsp;·&nbsp; ")}<br/>
      <span style="color:#777;font-size:13px">Optional — you can also just pay at your appointment.</span></p>`;
}
