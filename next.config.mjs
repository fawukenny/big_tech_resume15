/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next.js 14: externalize pdf.js on the server (top-level `serverExternalPackages` is Next 15+).
    serverComponentsExternalPackages: ["pdfjs-dist"],
    // pdf.js loads the worker via dynamic import(); NFT does not trace it unless we include it explicitly.
    // Without this, Vercel/Lambda throws: Cannot find module '.../pdf.worker.min.mjs'.
    outputFileTracingIncludes: {
      "/api/analyze": [
        "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
        "./node_modules/pdfjs-dist/build/pdf.worker.mjs",
        "./public/pdf.worker.min.mjs",
      ],
    },
  },
};

export default nextConfig;
