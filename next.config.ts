import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      // Placeholder campaign photography — same source the gallery already uses.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
