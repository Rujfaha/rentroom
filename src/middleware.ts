import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 1. Maintain Supabase Session (if any customer Auth is used later)
  const response = await updateSession(request);

  // 2. Custom Admin JWT Session Check
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_session")?.value;

  // Protect Admin Routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Prevent accessing Login if already logged in
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
