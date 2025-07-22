/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
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
