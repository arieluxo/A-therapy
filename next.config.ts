import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* output "standalone" solo para self-host (Caddy/Docker).
     En Vercel debe ir sin output para que el builder genere las rutas. */
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
