"use client";

import { SessionProvider } from "next-auth/react";

// Wraps the whole app so any client component (like the login form) can
// call next-auth/react's signIn/signOut/useSession.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
