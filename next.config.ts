import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "https://cornflowerblue-kingfisher-327437.hostingersite.com", "https://wixdash.com"],
    },
  },
  turbopack: {
    resolveAlias: {
      tailwindcss: path.resolve("./node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
