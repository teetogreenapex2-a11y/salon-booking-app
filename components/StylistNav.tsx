"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A stylist account only ever sees their own calendar, reports, and
// hours — everything else in AdminNav (customers, services, business
// settings, billing, etc.) is owner-only.
const LINKS = [
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/availability", label: "My hours" },
];

function isActive(pathname: string | null, href: string) {
  return pathname?.startsWith(href);
}

export default function StylistNav() {
  const pathname = usePathname();

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
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
