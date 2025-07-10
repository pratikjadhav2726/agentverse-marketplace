import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "./lib/utils";
import { cookies } from "next/headers";

const PROTECTED_PATHS = [
  "/dashboard",
  "/admin",
  "/settings",
  "/purchases",
  "/seller",
  "/workflows"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (!isProtected) return NextResponse.next();

  const token = cookies().get("auth_token")?.value;
  console.log("[middleware] Path:", pathname, "auth_token:", token);
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  const payload = await verifyJwt(token);
  if (!payload || !payload.id) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/purchases/:path*",
    "/seller/:path*",
    "/workflows/:path*"
  ]
}; 