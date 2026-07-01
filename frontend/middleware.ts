import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  AUTH_CALLBACK_PATH,
  DEFAULT_LOGIN_REDIRECT,
  isAuthRoute,
  isProtectedRoute,
  RESET_PASSWORD_PATH,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip when Supabase is not configured (e.g. CI build without secrets)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isPublicAuthFlow =
    pathname === AUTH_CALLBACK_PATH ||
    pathname === VERIFY_EMAIL_PATH ||
    pathname === RESET_PASSWORD_PATH;

  // Protected app routes — require session
  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pages — redirect signed-in users away (except callback / verify / reset)
  if (user && isAuthRoute(pathname) && !isPublicAuthFlow) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = DEFAULT_LOGIN_REDIRECT;
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
