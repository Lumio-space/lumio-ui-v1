import type { NextConfig } from 'next';

const enableReactCompiler = process.env.NEXT_PUBLIC_ENABLE_REACT_COMPILER === '';

const nextConfig: NextConfig = {
  reactCompiler: enableReactCompiler,

  /**
   * Remote image domains.
   *   - pravatar.cc: mock avatars used by lib/data.ts (remove in Phase 7).
   *   - res.cloudinary.com: school logos uploaded during onboarding (Phase 2).
   *     The wildcard pathname covers all cloud-name sub-paths.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  /**
   * Security headers — applied to all routes.
   * Phase 7: tighten CSP once third-party scripts are inventoried.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
