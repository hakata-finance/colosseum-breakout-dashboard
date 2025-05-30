import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

  // Image optimization for static export
  images: {
    unoptimized: true,
    domains: ['static.narrative-violation.com'],
  },

  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
