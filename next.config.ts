import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. We'll fix lint issues incrementally.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even if there are type errors.
    // We'll address type issues incrementally.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
