"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavGroup = { title: string; items: { href: string; label: string; count?: number }[] };

function isActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");
}

/** 桌面端：左侧分组导航；移动端：顶部横向滚动导航 */
export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  return (
    <>
      <nav className="hidden space-y-5 md:block">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-3 text-[11px] font-semibold tracking-widest text-slate-500">{g.title}</div>
            <ul className="mt-1.5 space-y-0.5">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      isActive(path, it.href) ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    {it.label}
                    {!!it.count && (
                      <span className="rounded-full bg-amber-400/90 px-1.5 text-[11px] font-semibold leading-5 text-navy">{it.count}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:hidden">
        {groups.flatMap((g) => g.items).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              isActive(path, it.href) ? "bg-white/15 text-white" : "text-slate-300"
            }`}
          >
            {it.label}
            {!!it.count && <span className="ml-1 text-amber-300">{it.count}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}
