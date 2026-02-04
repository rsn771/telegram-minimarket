import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  // Убраны CSP заголовки для работы в Telegram Mini App
  // Telegram требует более гибкую политику безопасности
};

export default nextConfig;