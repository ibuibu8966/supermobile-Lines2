const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/validation", "@repo/utils", "@repo/entities"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", "prisma", "@repo/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gaenfufkolwratvthiot.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
