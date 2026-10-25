"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/market", label: "找设备" },
  { href: "/market/wanted", label: "求租" },
  { href: "/market/become-host", label: "我要出租" },
  { href: "/market/community", label: "交流区" },
];

export function MarketTabs() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/market"
      ? path === "/market" || (/^\/market\/[^/]+$/.test(path) && !TABS.some((t) => t.href === path) && !["/market/publish", "/market/mine", "/market/rules"].includes(path))
      : path.startsWith(href);
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
            active(t.href) ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
