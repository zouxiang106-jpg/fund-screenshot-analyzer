import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: {
    proxyClientMaxBodySize: "2mb",
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
