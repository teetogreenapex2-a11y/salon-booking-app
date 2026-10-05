"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BarChart3, Clock, Wallet, Tag, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// A stylist account only ever sees their own calendar, reports, hours,
// and pricing — everything else in AdminNav (customers, services as a
// whole, business settings, billing, etc.) is owner-only.
function linksFor(stylistId: string | null, isBoothRenter: boolean) {
  const links: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: "/admin/calendar", label: "Calendar", Icon: CalendarDays },
    { href: "/admin/reports", label: "Reports", Icon: BarChart3 },
    { href: "/admin/availability", label: "My hours", Icon: Clock },
    { href: "/admin/get-paid", label: "Get paid", Icon: Wallet },
  ];
  if (stylistId) {
    links.push({ href: `/admin/stylists/${stylistId}/pricing`, label: "My pricing", Icon: Tag });
  }
  if (isBoothRenter) {
    links.push({ href: "/admin/my-billing", label: "My billing", Icon: CreditCard });
  }
  return links;
}

function isActive(pathname: string | null, href: string) {
  return pathname?.startsWith(href);
}

export default function StylistNav({
  stylistId,
  isBoothRenter = false,
}: {
  stylistId: string;
  isBoothRenter?: boolean;
}) {
  const pathname = usePathname();
  const LINKS = linksFor(stylistId, isBoothRenter);

  return (
    <>
      <nav className="admin-nav-links admin-nav-full">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>

      <nav className="admin-nav-bottom">
        {LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
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
      </nav>
    </>
  );
}
