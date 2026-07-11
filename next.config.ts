import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: "/Users/haresh-mac-mini/hardik/other/quizzer",
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
