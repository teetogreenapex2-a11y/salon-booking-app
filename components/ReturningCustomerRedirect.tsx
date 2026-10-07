"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A customer who has booked before lands on their salon's page instead of
// the sales page. Add ?stay=1 to the address to see the sales page anyway.
export default function ReturningCustomerRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      const slug = localStorage.getItem("hsx_last_salon");
      if (slug && /^[a-z0-9-]+$/.test(slug)) router.replace(`/${slug}`);
    } catch {}
  }, [router]);
  return null;
}
