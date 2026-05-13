import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getMiddlewareRedirectTarget } from "@/lib/middlewareRedirects";

export function middleware(request: NextRequest) {
  const target = getMiddlewareRedirectTarget(request.nextUrl.pathname);
  if (target !== null) {
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
