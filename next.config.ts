/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Phase 19: greeting-card uses an SVG asset rendered via
    // next/image. SVG is blocked by default for security; this allows
    // it. Combined with a strict CSP via the `contentSecurityPolicy`
    // option to mitigate the canonical SVG injection risk vector.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
