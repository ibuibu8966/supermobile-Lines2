const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/validation"],
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma", "@repo/shared"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

module.exports = nextConfig;
