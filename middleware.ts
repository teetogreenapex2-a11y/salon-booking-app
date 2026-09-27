import { NextRequest, NextResponse } from "next/server";

// Protects everything under /admin. Not real multi-user auth — just a
// single shared password gate for the business owner, matching the
// scale of this app right now. Swap for real auth if staff accounts
// are ever needed.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session !== process.env.ADMIN_PASSWORD) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
