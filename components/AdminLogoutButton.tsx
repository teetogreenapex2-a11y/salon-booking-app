"use client";

import { signOut } from "next-auth/react";

export default function AdminLogoutButton() {
  return (
    <button
      className="btn-ghost"
      style={{ padding: "8px 14px", fontSize: 13 }}
      onClick={async () => {
        // redirect:false keeps us on the same host (see login page) so the
        // iOS app doesn't bounce out to the browser.
        await signOut({ redirect: false });
        window.location.href = "/login";
      }}
    >
      Log out
    </button>
  );
}
