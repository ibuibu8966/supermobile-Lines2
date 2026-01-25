/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/auth", "@repo/validation"],
};

module.exports = nextConfig;
