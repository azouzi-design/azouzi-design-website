import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The home page is the project gallery now: old project pages open their
  // project there, and the /concept preview it grew from points home.
  redirects() {
    return [
      { source: "/projects/:slug", destination: "/?project=:slug", permanent: true },
      { source: "/concept", destination: "/", permanent: false },
    ];
  },
  images: {
    // 90 is used by the profile photo; the default is 75.
    qualities: [75, 90],
  },
};

export default nextConfig;
