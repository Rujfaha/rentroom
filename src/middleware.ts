import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  SESSION_COOKIE,
  decrypt,
  type SessionPayload,
} from "@/lib/session-core";

function clearAdminSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function redirectToLogin(request: NextRequest) {
  return clearAdminSession(NextResponse.redirect(new URL("/login", request.url)));
}

function redirectToAdmin(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin", request.url));
}

function hasValidAdminScope(session: SessionPayload) {
  if (session.role === "super_admin") return true;
  return Boolean(session.hotelId);
}

export async function middleware(request: NextRequest) {
  // 1. Maintain Supabase Session (if any customer Auth is used later)
  const response = await updateSession(request);

  // 2. Custom Admin JWT Session Check
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);

  // Protect Admin Routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
    if (!session || !hasValidAdminScope(session)) {
      return redirectToLogin(request);
    }

    if (pathname.startsWith("/superadmin") && session.role !== "super_admin") {
      return redirectToAdmin(request);
    }

    if (
      (pathname.startsWith("/admin/cms") || pathname.startsWith("/admin/pricing")) &&
      session.role !== "admin" &&
      session.role !== "super_admin"
    ) {
      return redirectToAdmin(request);
    }
  }

  // Prevent accessing Login if already logged in
  if (pathname === "/login") {
    if (token && !session) {
      return clearAdminSession(response);
    }

    if (session && hasValidAdminScope(session)) {
      return redirectToAdmin(request);
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
