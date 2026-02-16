/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/validation"],
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma", "@repo/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
