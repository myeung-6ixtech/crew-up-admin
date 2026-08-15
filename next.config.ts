import type { NextConfig } from 'next';
import { env } from '@/lib/env';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `*.storage.${env.NEXT_PUBLIC_NHOST_REGION}.nhost.run`,
      },
    ],
  },
};

export default nextConfig;
