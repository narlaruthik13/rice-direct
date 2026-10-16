/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@kisa/shared", "@kisa/ui"],
  // A separate build folder (e.g. NEXT_DIST_DIR=.next-verify) lets a test build run
  // without overwriting the .next folder a running `next dev` is using.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Kisa is rice-only: the old category pages (and any shared links to them) go to the shop.
  async redirects() {
    return [
      { source: "/shop/rice", destination: "/shop", permanent: true },
      { source: "/shop/rice/:rest*", destination: "/shop", permanent: true },
      { source: "/shop/onions", destination: "/shop", permanent: true },
      { source: "/shop/onions/:rest*", destination: "/shop", permanent: true },
    ];
  },
};

export default nextConfig;
