import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
  // Pure static export — generates HTML files for every page so the app can
  // be hosted on any static-file CDN (Cloudflare Pages, Netlify, GitHub
  // Pages, S3, …) without a Node runtime. No API routes, no server actions,
  // no middleware. All dynamic segments must have generateStaticParams.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
