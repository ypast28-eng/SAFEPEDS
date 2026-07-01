/** Routes that require an authenticated session */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/cycle-builder",
  "/my-cycles",
  "/bloodwork",
  "/risk",
  "/ai",
  "/knowledge-base",
  "/settings",
] as const;

/** Auth pages — redirect to dashboard when already signed in */
export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export const AUTH_CALLBACK_PATH = "/auth/callback";
export const VERIFY_EMAIL_PATH = "/verify-email";
export const RESET_PASSWORD_PATH = "/reset-password";
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
