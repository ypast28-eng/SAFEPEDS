/** Full-page redirect so middleware sees the new Supabase session cookies. */
export function redirectAfterAuth(path: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(path);
}
