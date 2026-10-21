import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The QA Lab runs a real headless Chromium inside its API routes. These packages
  // ship native binaries / large sources, so keep them out of the bundle and make
  // sure the Chromium archive is traced into the deployed functions.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "axe-core"],
  // One canonical host: www.salmansadiq.com permanently redirects to the apex domain.
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.salmansadiq.com" }], destination: "https://salmansadiq.com/:path*", permanent: true },
    ];
  },
  outputFileTracingIncludes: {
    "/api/qa/**": ["./node_modules/@sparticuz/chromium/bin/**", "./node_modules/axe-core/axe.min.js"],
  },
};

export default nextConfig;
