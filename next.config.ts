import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/api/analyze": ["./node_modules/tesseract.js/**"],
  },
};

export default nextConfig;
