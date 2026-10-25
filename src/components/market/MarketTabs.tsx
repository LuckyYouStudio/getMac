"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/market", label: "找设备" },
  { href: "/market/wanted", label: "求租" },
  { href: "/market/become-host", label: "我要出租" },
  { href: "/market/community", label: "交流区" },
  { href: "/market/messages", label: "消息" },
];

const OTHER_SECTIONS = ["/market/wanted", "/market/become-host", "/market/community", "/market/messages", "/market/rules", "/market/mine", "/market/publish"];

export function MarketTabs({ unread }: { unread: number }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/market" ? !OTHER_SECTIONS.some((s) => path.startsWith(s)) : path.startsWith(href);
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`relative shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
            active(t.href) ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
          {t.href === "/market/messages" && unread > 0 && (
            <span className="ml-1 rounded-full bg-danger px-1.5 text-[10px] leading-4 text-white">{unread}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
