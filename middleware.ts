import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { basePath, withBasePath } from "@/lib/base-path";

const { auth } = NextAuth(authConfig);

// When AUTH_URL is set, Auth.js hands this middleware a copy of the request rebuilt from that URL,
// and the copy's nextUrl no longer knows the site's base path (next.config.mjs): its pathname still
// starts with it. So the base path comes off before matching and goes back on for redirects.
function sitePath(pathname: string) {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
}

function redirectTo(origin: string, pathname: string, callbackUrl?: string) {
  const url = new URL(withBasePath(pathname), origin);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(url);
}

export default auth((req) => {
  const pathname = sitePath(req.nextUrl.pathname);
  const { origin } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return redirectTo(origin, "/login", pathname);
    }
    if (role !== "ADMIN" && role !== "STAFF") {
      return redirectTo(origin, "/");
    }
  }

  if (pathname.startsWith("/account")) {
    if (!req.auth) {
      return redirectTo(origin, "/login", pathname);
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
