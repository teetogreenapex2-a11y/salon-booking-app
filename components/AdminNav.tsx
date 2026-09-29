"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The 5 most-used pages — these become the fixed bottom tab bar on phones.
const PRIMARY_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/stylists", label: "Stylists" },
];

// Less-frequent pages — shown as a horizontal pill row up top on phones.
const SECONDARY_LINKS = [
  { href: "/admin/services", label: "Services" },
  { href: "/admin/availability", label: "Hours" },
  { href: "/admin/business", label: "Business" },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

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
        {PRIMARY_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
