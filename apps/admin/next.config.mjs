/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source (ui) or CommonJS (shared); Next compiles them.
  transpilePackages: ["@kisa/shared", "@kisa/ui"],
  poweredByHeader: false,
};

export default nextConfig;
