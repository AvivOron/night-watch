import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.119'],
  basePath: process.env.NODE_ENV === 'production' ? '/night-watch' : '',
};

export default nextConfig;
