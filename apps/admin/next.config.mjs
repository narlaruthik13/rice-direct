/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source (ui) or CommonJS (shared); Next compiles them.
  transpilePackages: ["@kisa/shared", "@kisa/ui"],
  poweredByHeader: false,
  // A separate build folder (e.g. NEXT_DIST_DIR=.next-verify) lets a test build run
  // without overwriting the .next folder a running `next dev` is using.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
