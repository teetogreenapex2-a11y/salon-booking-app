"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, ClipboardList, Users, Scissors } from "lucide-react";

// The 5 most-used pages — these become the fixed bottom tab bar on phones.
const PRIMARY_LINKS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", Icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/stylists", label: "Stylists", Icon: Scissors },
];

// Less-frequent pages — shown as a horizontal pill row up top on phones.
const SECONDARY_LINKS = [
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/availability", label: "Hours" },
  { href: "/admin/business", label: "Business" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/gallery", label: "Gallery" },
];

const ALL_LINKS: { href: string; label: string }[] = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

function isActive(pathname: string | null, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Full nav — visible on desktop, hidden on phones */}
      <nav className="admin-nav-links admin-nav-full">
        {ALL_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Secondary pills — hidden on desktop, horizontal row up top on phones */}
      <nav className="admin-nav-secondary">
        {SECONDARY_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom tab bar — hidden on desktop, fixed to bottom on phones */}
      <nav className="admin-nav-bottom">
        {PRIMARY_LINKS.map(({ href, label, Icon }) => {
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
