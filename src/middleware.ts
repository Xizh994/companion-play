import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_PREFIXES = ["/api/", "/_next/", "/shop/", "/profile/", "/favicon.ico"];

function isProtected(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return false;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get("dazistar_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
