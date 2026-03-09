/**
 * Base URL for API requests. Empty string in browser (same-origin). Absolute URL on server.
 * On Vercel, uses VERCEL_URL so server components can fetch own API (localhost fails there).
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}
