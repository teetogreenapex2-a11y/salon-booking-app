import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="admin-nav">
        <span className="display admin-nav-title">Salon Admin</span>
        <AdminNav />
        <AdminLogoutButton />
      </div>
      <main className="admin-page">{children}</main>
    </div>
  );
}
