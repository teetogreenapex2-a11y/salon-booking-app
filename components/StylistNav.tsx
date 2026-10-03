"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A stylist account only ever sees their own calendar, reports, hours,
// and pricing — everything else in AdminNav (customers, services as a
// whole, business settings, billing, etc.) is owner-only.
function linksFor(stylistId: string | null) {
  const links = [
    { href: "/admin/calendar", label: "Calendar" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/availability", label: "My hours" },
  ];
  if (stylistId) {
    links.push({ href: `/admin/stylists/${stylistId}/pricing`, label: "My pricing" });
  }
  return links;
}

function isActive(pathname: string | null, href: string) {
  return pathname?.startsWith(href);
}

export default function StylistNav({ stylistId }: { stylistId: string }) {
  const pathname = usePathname();
  const LINKS = linksFor(stylistId);

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
