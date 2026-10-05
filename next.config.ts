import type { NextConfig } from "next";

const rawBackendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

const cleanBackendUrl = rawBackendUrl.trim().replace(/\/$/, "");
const backendApiUrl = cleanBackendUrl.endsWith("/api")
  ? cleanBackendUrl
  : `${cleanBackendUrl}/api`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

