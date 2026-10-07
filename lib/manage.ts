import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function newManageToken() {
  return randomBytes(18).toString("base64url");
}

export function manageUrl(token: string, origin?: string) {
  const base = process.env.APP_URL || origin || "https://hairsalonix.com";
  return `${base.replace(/\/$/, "")}/manage/${token}`;
}

// Older bookings were made before links existed — give them one on demand.
export async function ensureManageToken(bookingId: string, existing?: string | null) {
  if (existing) return existing;
  const token = newManageToken();
  await prisma.booking.update({ where: { id: bookingId }, data: { manageToken: token } });
  return token;
}

export function formatWhen(d: Date, timeZone: string) {
  try {
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
  } catch {
    return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
}

// Customers may only change a booking that is still confirmed, in the
// future, and further away than the salon's cutoff.
export function changeStatus(
  booking: { status: string; startsAt: Date },
  cutoffHours: number
): "ok" | "closed" | "too_late" {
  if (booking.status !== "CONFIRMED") return "closed";
  const msLeft = booking.startsAt.getTime() - Date.now();
  if (msLeft <= 0) return "closed";
  if (msLeft < cutoffHours * 3600 * 1000) return "too_late";
  return "ok";
}
