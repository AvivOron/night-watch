import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.119', '192.168.1.201'],
  basePath: isProd ? '/night-watch' : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? '/night-watch' : '',
  },
};

export default nextConfig;
