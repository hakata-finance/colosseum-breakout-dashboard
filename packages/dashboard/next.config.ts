import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic configuration
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Disable ESLint during builds (for deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds (for deployment)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.narrative-violation.com',
      },
    ],
  },

  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
