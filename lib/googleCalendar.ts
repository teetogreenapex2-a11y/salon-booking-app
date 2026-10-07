import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// One-way sync: Hairsalonix bookings -> the stylist's own Google Calendar.
// Uses only the narrow "calendar.events" scope (create/change/delete events),
// never email or contacts.

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function googleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appUrl() {
  return (process.env.APP_URL || "https://hairsalonix.com").replace(/\/$/, "");
}

export function redirectUri() {
  return `${appUrl()}/api/auth/google-calendar/callback`;
}

// Signed, expiring "state" so the callback knows which stylist is connecting
// and can't be forged.
function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}
export function signState(payload: { stylistId: string; email: string }) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 15 * 60_000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyState(state: string): { stylistId: string; email: string } | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { stylistId: data.stylistId, email: data.email };
  } catch {
    return null;
  }
}

export function authUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { access_token: string; refresh_token?: string };
}

async function accessToken(stylistId: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // The stylist revoked access (or the token died): stop trying.
    if (body?.error === "invalid_grant") {
      await prisma.stylist.update({ where: { id: stylistId }, data: { googleRefreshToken: null } });
    }
    return null;
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

const EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Creates, updates or removes the Google event so it matches the booking's
// current state. Safe to call any time; never throws (a calendar hiccup must
// not break booking).
export async function syncBookingToGoogle(bookingId: string) {
  try {
    if (!googleConfigured()) return;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { stylist: true, service: true, business: true },
    });
    if (!booking?.stylist.googleRefreshToken) return;

    const token = await accessToken(booking.stylistId, booking.stylist.googleRefreshToken);
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const shouldExist = booking.status === "CONFIRMED" || booking.status === "COMPLETED";

    if (!shouldExist) {
      if (booking.googleEventId) {
        await fetch(`${EVENTS}/${booking.googleEventId}`, { method: "DELETE", headers });
        await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: null } });
      }
      return;
    }

    const tz = booking.business.timezone || "America/New_York";
    const event = {
      summary: `${booking.service.name} - ${booking.customerName}`,
      description: [
        `Booked through Hairsalonix`,
        `Client: ${booking.customerName}`,
        booking.customerPhone ? `Phone: ${booking.customerPhone}` : "",
        `Email: ${booking.customerEmail}`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: booking.startsAt.toISOString(), timeZone: tz },
      end: { dateTime: booking.endsAt.toISOString(), timeZone: tz },
    };

    if (booking.googleEventId) {
      const res = await fetch(`${EVENTS}/${booking.googleEventId}`, { method: "PUT", headers, body: JSON.stringify(event) });
      if (res.status !== 404 && res.status !== 410) return;
      // Event was deleted on their side: fall through and recreate.
    }
    const res = await fetch(EVENTS, { method: "POST", headers, body: JSON.stringify(event) });
    if (res.ok) {
      const created = (await res.json()) as { id: string };
      await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: created.id } });
    } else {
      console.error("Google Calendar create failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Google Calendar sync failed", err);
  }
}

// After someone connects, put their already-booked upcoming appointments on
// the calendar too.
export async function syncUpcomingForStylist(stylistId: string) {
  const upcoming = await prisma.booking.findMany({
    where: { stylistId, status: "CONFIRMED", startsAt: { gte: new Date() }, googleEventId: null },
    select: { id: true },
    take: 200,
  });
  for (const b of upcoming) await syncBookingToGoogle(b.id);
}
