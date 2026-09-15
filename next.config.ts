import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to dev-only resources (hot
  // reload, _next/* assets) by default — only "localhost" is allowed out
  // of the box. Without this, opening the dev server's "Network" URL
  // (e.g. http://192.168.x.x:3100) from another device on the LAN loads
  // the page but every interactive bit stays dead, since the JS bundle
  // and HMR socket both get silently blocked. Covers the private IP
  // ranges teammates are likely on (home/office Wi-Fi); doesn't affect
  // production (`next start`), only `next dev`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
