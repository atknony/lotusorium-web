import type { NextConfig } from "next";

// Security headers applied to every response. Kept conservative — the app
// makes no cross-origin embeds and talks only to its own BFF + Cloudinary.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,

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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
