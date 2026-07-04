import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "tesseract.js", "@napi-rs/canvas"],
};

export default nextConfig;
