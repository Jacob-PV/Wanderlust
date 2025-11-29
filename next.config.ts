import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent Leaflet double initialization
};

export default nextConfig;
