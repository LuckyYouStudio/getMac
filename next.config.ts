import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  webpack(config, { dev }) {
    if (dev) {
      // 每次访问都会写 SQLite（浏览统计），若被监听会触发重新编译 → 页面刷新 → 再次写库的循环，
      // 导致点击导航被刷新打断
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/prisma/*.db*"],
      };
    }
    return config;
  },
};

export default nextConfig;
