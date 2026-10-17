// Pages an owner can pin to the phone bottom bar. Anything not pinned
// shows in the "More" sheet. Keys are stored in Business.navTabs (JSON).
export const NAV_CATALOG = [
  { key: "dashboard", href: "/admin", label: "Dashboard" },
  { key: "calendar", href: "/admin/calendar", label: "Calendar" },
  { key: "bookings", href: "/admin/bookings", label: "Bookings" },
  { key: "customers", href: "/admin/customers", label: "Customers" },
  { key: "stylists", href: "/admin/stylists", label: "Stylists" },
  { key: "waitlist", href: "/admin/waitlist", label: "Waitlist" },
  { key: "marketing", href: "/admin/marketing", label: "Email" },
  { key: "gift-cards", href: "/admin/gift-cards", label: "Gift cards" },
  { key: "memberships", href: "/admin/memberships", label: "Memberships" },
  { key: "services", href: "/admin/services", label: "Services" },
  { key: "products", href: "/admin/products", label: "Products" },
  { key: "availability", href: "/admin/availability", label: "Hours" },
  { key: "reports", href: "/admin/reports", label: "Reports" },
  { key: "gallery", href: "/admin/gallery", label: "Gallery" },
  { key: "business", href: "/admin/business", label: "Business" },
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
