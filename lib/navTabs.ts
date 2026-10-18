// Pages an owner can pin to the phone bottom bar. Anything not pinned
// shows in the "More" sheet. Keys are stored in Business.navTabs (JSON).
export const NAV_CATALOG = [
  { key: "dashboard", href: "/admin", label: "Dashboard", sf: "square.grid.2x2.fill" },
  { key: "calendar", href: "/admin/calendar", label: "Calendar", sf: "calendar" },
  { key: "bookings", href: "/admin/bookings", label: "Bookings", sf: "list.bullet.rectangle.fill" },
  { key: "customers", href: "/admin/customers", label: "Customers", sf: "person.2.fill" },
  { key: "stylists", href: "/admin/stylists", label: "Stylists", sf: "scissors" },
  { key: "waitlist", href: "/admin/waitlist", label: "Waitlist", sf: "hourglass" },
  { key: "marketing", href: "/admin/marketing", label: "Email", sf: "envelope.fill" },
  { key: "gift-cards", href: "/admin/gift-cards", label: "Gift cards", sf: "gift.fill" },
  { key: "memberships", href: "/admin/memberships", label: "Memberships", sf: "repeat" },
  { key: "services", href: "/admin/services", label: "Services", sf: "sparkles" },
  { key: "products", href: "/admin/products", label: "Products", sf: "bag.fill" },
  { key: "availability", href: "/admin/availability", label: "Hours", sf: "clock.fill" },
  { key: "reports", href: "/admin/reports", label: "Reports", sf: "chart.bar.fill" },
  { key: "gallery", href: "/admin/gallery", label: "Gallery", sf: "photo.fill" },
  { key: "business", href: "/admin/business", label: "Business", sf: "gearshape.fill" },
] as const;

export const MAX_TABS = 4; // the 5th slot is always "More"
export const DEFAULT_TABS: string[] = ["dashboard", "calendar", "bookings", "customers"];

const KEYS = new Set<string>(NAV_CATALOG.map((c) => c.key));

export function cleanTabs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const k of input) {
    if (typeof k === "string" && KEYS.has(k) && !out.includes(k)) out.push(k);
  }
  return out.slice(0, MAX_TABS);
}

export function parseTabs(json: string | null | undefined): string[] {
  if (!json) return DEFAULT_TABS;
  try {
    const t = cleanTabs(JSON.parse(json));
    return t.length ? t : DEFAULT_TABS;
  } catch {
    return DEFAULT_TABS;
  }
}
