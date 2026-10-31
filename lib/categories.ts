// Service categories (Hair, Nails, …). Free text so any salon can use its
// own, with these as suggestions and as the preferred display order.
export const CATEGORY_SUGGESTIONS = ["Hair", "Nails", "Barber", "Lashes", "Brows", "Skin", "Massage", "Waxing", "Makeup"];

export function cleanCategory(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ").slice(0, 40);
  return t || null;
}

// Groups items under their category: suggested categories first (in the
// order above), then any custom ones A–Z, uncategorized last. Keeps each
// group's items in their incoming order.
export function groupByCategory<T extends { category?: string | null }>(items: T[]) {
  const map = new Map<string | null, T[]>();
  for (const it of items) {
    const key = cleanCategory(it.category);
    const list = map.get(key);
    if (list) list.push(it);
    else map.set(key, [it]);
  }
  const rank = (c: string | null) => {
    if (c === null) return 1000;
    const i = CATEGORY_SUGGESTIONS.findIndex((x) => x.toLowerCase() === c.toLowerCase());
    return i === -1 ? 500 : i;
  };
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || String(a[0]).localeCompare(String(b[0])))
    .map(([category, list]) => ({ category, items: list }));
}
