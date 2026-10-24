import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

loadEnvConfig(fileURLToPath(new URL("../..", import.meta.url)));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  reactStrictMode: true,
  transpilePackages: ["@viajeroshub/database", "@viajeroshub/shared"],
};

export default nextConfig;
