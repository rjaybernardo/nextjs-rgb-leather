import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/client",
    "prisma",
    "ws",
  ],
};

export default nextConfig;
