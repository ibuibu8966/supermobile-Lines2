/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/auth", "@repo/validation"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/**/*"],
  },
  serverExternalPackages: ["@prisma/client"],
};

module.exports = nextConfig;
