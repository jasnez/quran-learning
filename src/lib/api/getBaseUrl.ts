/**
 * Base URL for API requests. Empty string in browser (same-origin). Absolute URL on server.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}
