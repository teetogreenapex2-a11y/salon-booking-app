import Link from "next/link";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="admin-nav">
        <span className="display admin-nav-title">Salon Admin</span>
        <nav className="admin-nav-links">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <Link href="/admin/stylists">Stylists</Link>
          <Link href="/admin/services">Services</Link>
          <Link href="/admin/availability">Hours</Link>
          <Link href="/admin/business">Business</Link>
        </nav>
        <AdminLogoutButton />
      </div>
      <main className="page">{children}</main>
    </div>
  );
}
