// A starter menu so a new salon has something real on day one. Prices and
// times are typical placeholders — the owner is asked to check them.
export type StarterKind = "hair" | "nails" | "both" | "barber";

type S = { name: string; durationMin: number; priceCents: number; category: string };

const HAIR: S[] = [
  { name: "Women's Haircut", durationMin: 60, priceCents: 6500, category: "Hair" },
  { name: "Men's Haircut", durationMin: 30, priceCents: 3500, category: "Hair" },
  { name: "Blowout", durationMin: 45, priceCents: 4500, category: "Hair" },
  { name: "Color", durationMin: 120, priceCents: 12000, category: "Hair" },
  { name: "Highlights", durationMin: 150, priceCents: 15000, category: "Hair" },
];
const NAILS: S[] = [
  { name: "Manicure", durationMin: 45, priceCents: 3500, category: "Nails" },
  { name: "Gel Manicure", durationMin: 60, priceCents: 5000, category: "Nails" },
  { name: "Pedicure", durationMin: 60, priceCents: 5000, category: "Nails" },
  { name: "Mani + Pedi", durationMin: 105, priceCents: 8000, category: "Nails" },
];
const BARBER: S[] = [
  { name: "Haircut", durationMin: 30, priceCents: 3000, category: "Barber" },
  { name: "Beard Trim", durationMin: 15, priceCents: 1500, category: "Barber" },
  { name: "Haircut + Beard", durationMin: 45, priceCents: 4000, category: "Barber" },
];

export function starterServices(kind: string): S[] {
  if (kind === "hair") return HAIR;
  if (kind === "nails") return NAILS;
  if (kind === "barber") return BARBER;
  if (kind === "both") return [...HAIR, ...NAILS];
  return [];
}
