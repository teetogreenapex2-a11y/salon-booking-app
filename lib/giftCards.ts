import { prisma } from "@/lib/prisma";

// No 0/O/1/I so codes are easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeCode() {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s.slice(0, 4) + "-" + s.slice(4);
}

export function normalizeCode(raw: string) {
  const c = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length === 8 ? c.slice(0, 4) + "-" + c.slice(4) : c;
}

export async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = makeCode();
    if (!(await prisma.giftCard.findUnique({ where: { code } }))) return code;
  }
  throw new Error("Couldn't generate a gift card code");
}

export function dollarsToCents(v: unknown) {
  const n = Math.round(Number(v) * 100);
  return Number.isFinite(n) ? n : NaN;
}
