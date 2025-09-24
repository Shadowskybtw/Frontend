import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Fix preload issues
  poweredByHeader: false,
  // Ensure proper asset handling
  trailingSlash: false,
  // Disable problematic optimizations that cause HTML in JS
  compress: false,
};

export default nextConfig;
