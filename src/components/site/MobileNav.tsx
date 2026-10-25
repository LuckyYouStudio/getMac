"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav({
  nav,
  loggedIn,
  isAdmin,
}: {
  nav: { href: string; label: string }[];
  loggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    ...nav,
    ...(loggedIn
      ? [
          { href: "/messages", label: "消息" },
          { href: "/orders", label: "我的订单" },
          { href: "/account", label: "账户" },
          ...(isAdmin ? [{ href: "/admin", label: "后台管理" }] : []),
        ]
      : [{ href: "/login", label: "登录 / 注册" }]),
  ];
  return (
    <div className="md:hidden">
      <button className="btn-ghost px-2" aria-label="菜单" onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-surface px-4 py-3 shadow-lg">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm text-ink-soft hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
