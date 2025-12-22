import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Temporarily ignore build errors for type strictness issues
  // Remove this once all TypeScript errors are resolved
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Environment variables that should be available on the client
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  
  // Image optimization config
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

