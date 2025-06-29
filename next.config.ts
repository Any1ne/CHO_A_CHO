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
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com", // <== додай сюди
        pathname: "/image-preview/**", // або "**" якщо хочеш повністю
      },
    ],
  },
};

module.exports = nextConfig;
