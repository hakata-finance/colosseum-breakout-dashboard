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

  // Enhanced error handling for production
  experimental: {
    // Better hydration error recovery and bundle optimization
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // Custom webpack config to handle extension conflicts
  webpack: (config, { dev, isServer }) => {
    // Only apply in production client builds
    if (!dev && !isServer) {
      // Add fallbacks for browser-only APIs
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
