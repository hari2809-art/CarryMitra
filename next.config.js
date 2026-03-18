/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: true,
});

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/CarryMitra',
  assetPrefix: '/CarryMitra',
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
