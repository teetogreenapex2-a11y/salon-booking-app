export { default } from "next-auth/middleware";

// Anything under /admin now requires a signed-in user. NextAuth's built-in
// middleware handles the redirect to the sign-in page (set in
// lib/auth.ts's `pages.signIn`) automatically.
export const config = {
  matcher: ["/admin/:path*"],
};
