"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      className="btn-ghost"
      style={{ padding: "8px 14px", fontSize: 13 }}
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
