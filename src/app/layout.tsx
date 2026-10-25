import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: { default: `${SITE.name} · ${SITE.slogan}`, template: `%s · ${SITE.name}` },
  description: "实体机独享的远程 Mac 租赁，以及第三方房东的 Mac 出租市场。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
