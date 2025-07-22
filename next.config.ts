/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/feedback/:id",
        destination: "/api/feedback/:id",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "petrovka-horeca.com.ua",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
