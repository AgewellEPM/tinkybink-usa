/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Build optimizations
  swcMinify: false,
  poweredByHeader: false,
  
  // Experimental features for better compatibility
  experimental: {
    esmExternals: false,
  },
  
  // Environment configuration removed - using system env vars
  
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
}

module.exports = nextConfig