import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "@thednp/dommatrix",
    "path2d",
    "@canvas/image-data",
  ],
};

export default nextConfig;
