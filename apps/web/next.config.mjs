/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@kisa/shared", "@kisa/ui"],
};

export default nextConfig;
