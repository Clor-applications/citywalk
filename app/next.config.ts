import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cache Components stay off until the authed routes are migrated deliberately. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/walk", destination: "/walk/index.html" }];
  },
};

export default nextConfig;
