/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/json/:path*", // наприклад, /api/json/products
        destination: "http://localhost:3001/:path*", // редирект на json-server
      },
    ];
  },
};

module.exports = nextConfig;
