"use client";

import { useRouter } from "next/navigation";

export default function RemoveWaitlistButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}
