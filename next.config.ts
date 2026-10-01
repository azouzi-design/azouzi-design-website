import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 90 is used by the profile photo; the default is 75.
    qualities: [75, 90],
  },
};

export default nextConfig;
