"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ops", label: "概览" },
  { href: "/ops/machines/new", label: "登记机器" },
  { href: "/ops/payout", label: "收款信息" },
];

export function OpsNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/ops" ? path === "/ops" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${active ? "bg-brand-soft font-medium text-brand" : "text-ink-soft hover:bg-surface-2"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
