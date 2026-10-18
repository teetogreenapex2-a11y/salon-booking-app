"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Scissors,
  Hourglass,
  Mail,
  Gift,
  Repeat,
  Sparkles,
  ShoppingBag,
  Clock,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Ellipsis,
  X,
  type LucideIcon,
} from "lucide-react";
import { NAV_CATALOG, parseTabs } from "@/lib/navTabs";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  bookings: ClipboardList,
  customers: Users,
  stylists: Scissors,
  waitlist: Hourglass,
  marketing: Mail,
  "gift-cards": Gift,
  memberships: Repeat,
  services: Sparkles,
  products: ShoppingBag,
  availability: Clock,
  reports: BarChart3,
  gallery: ImageIcon,
  business: Settings,
};

function isActive(pathname: string | null, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
}

export default function AdminNav({ tabsJson }: { tabsJson?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const chosenKeys = parseTabs(tabsJson);
  const chosen = chosenKeys.map((k) => NAV_CATALOG.find((c) => c.key === k)!).filter(Boolean);
  const rest = NAV_CATALOG.filter((c) => !chosenKeys.includes(c.key));
  const moreActive = rest.some((c) => isActive(pathname, c.href));

  // Inside the Hairsalonix app, the native tab bar draws these tabs. Send it
  // the list (and which one is active); it sends back taps as events.
  const tabsKey = chosenKeys.join(",");
  const activeKey = NAV_CATALOG.find((c) => isActive(pathname, c.href) && chosenKeys.includes(c.key))?.key ?? "";
  useEffect(() => {
    const native = (window as any).HxTabBar;
    if (!native?.setTabs) return;
    native.setTabs(
      JSON.stringify(chosenKeys.map((k) => NAV_CATALOG.find((c) => c.key === k)!).map(({ key, label, href, sf }) => ({ key, label, href, sf }))),
      activeKey
    );
    document.documentElement.classList.add("native-nav");
  }, [tabsKey, activeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const native = (window as any).HxTabBar;
    const go = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (typeof href === "string" && href.startsWith("/admin")) router.push(href);
    };
    const more = () => setMoreOpen(true);
    window.addEventListener("hx-navigate", go);
    window.addEventListener("hx-open-more", more);
    return () => {
      window.removeEventListener("hx-navigate", go);
      window.removeEventListener("hx-open-more", more);
      // Leaving the admin area: take the native bar away again.
      if (native?.hide) {
        native.hide();
        document.documentElement.classList.remove("native-nav");
      }
    };
  }, [router]);

  // Close the sheet after navigating, and on Escape.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      {/* Full nav — visible on desktop, hidden on phones */}
      <nav className="admin-nav-links admin-nav-full">
        {NAV_CATALOG.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom tab bar — hidden on desktop, fixed to bottom on phones.
          The owner picks up to 4 tabs; the 5th is always More. */}
      <nav className="admin-nav-bottom">
        {chosen.map(({ key, href, label }) => {
          const Icon = ICONS[key];
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              className={`tab ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="tab-icon">
                <Icon size={22} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
              </span>
              <span className="tab-label">{label}</span>
            </Link>
          );
        })}
        {rest.length > 0 && (
          <button
            type="button"
            className={`tab tab-more ${moreActive || moreOpen ? "active" : ""}`}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span className="tab-icon">
              <Ellipsis size={22} strokeWidth={moreActive ? 2.3 : 1.8} aria-hidden />
            </span>
            <span className="tab-label">More</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="admin-sheet-wrap">
          <button type="button" className="admin-sheet-backdrop" aria-label="Close menu" onClick={() => setMoreOpen(false)} />
          <div className="admin-sheet" role="dialog" aria-modal="true" aria-label="More pages">
            <div className="admin-sheet-head">
              <span className="display" style={{ fontSize: 18 }}>More</span>
              <button type="button" className="admin-sheet-close" aria-label="Close" onClick={() => setMoreOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="admin-sheet-grid">
              {rest.map(({ key, href, label }) => {
                const Icon = ICONS[key];
                const active = isActive(pathname, href);
                return (
                  <Link key={key} href={href} className={`admin-sheet-item ${active ? "active" : ""}`}>
                    <span className="admin-sheet-icon">
                      <Icon size={24} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
