/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/json/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "petrovka-horeca.com.ua",
        pathname: "**", // allow all paths
      },
    ],
  },
};

module.exports = nextConfig;
