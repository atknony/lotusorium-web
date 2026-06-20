import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16: images.domains is deprecated — use remotePatterns.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Allow a couple of quality steps (Next 16 default is [75] only).
    qualities: [60, 75, 90],
  },
};

export default nextConfig;