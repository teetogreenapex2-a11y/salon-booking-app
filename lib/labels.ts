// Codes printed on QR labels for services and products that don't have a
// manufacturer barcode. No 0/O/1/I so they're easy to read if typed.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeLabelCode(prefix: "SVC" | "PRD") {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}-${s}`;
}

export function cleanBarcode(v: unknown) {
  const s = String(v ?? "").trim().slice(0, 64);
  return s || null;
}
