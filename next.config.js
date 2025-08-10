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
  swcMinify: true,
  poweredByHeader: false,
  
  // Experimental features for better compatibility
  experimental: {
    esmExternals: false,
  },
  
  // Handle self reference globally with webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Define self globally for server environment
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          self: 'global',
        })
      );
    }
    return config;
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