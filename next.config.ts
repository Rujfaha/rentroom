import type { NextConfig } from "next";

const lanDevOrigins = [
  "10.82.13.94",
  "10.82.13.94:3000",
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",") ?? []),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: lanDevOrigins,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "opuhiowkvfhrbewnfzpo.supabase.co",
      },
    ],
  },
};

export default nextConfig;
