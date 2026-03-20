/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next.js 14: externalize pdf.js on the server (top-level `serverExternalPackages` is Next 15+).
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

export default nextConfig;
