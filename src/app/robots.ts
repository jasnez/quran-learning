import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Required with `output: "export"`: the route is rendered once, at build time.
export const dynamic = "force-static";

/** Written to out/robots.txt at build time (static export). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
