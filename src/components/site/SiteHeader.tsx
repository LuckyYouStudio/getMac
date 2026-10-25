import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrowserOrderTokens } from "@/lib/order-access";
import { logoutAction } from "@/app/(site)/(auth)/actions";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/pricing", label: "自营方案" },
  { href: "/market", label: "租赁市场" },
  { href: "/guide", label: "使用指南" },
  { href: "/faq", label: "常见问题" },
  { href: "/about", label: "关于我们" },
  { href: "/join", label: "成为房东" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const [unread, guestOrders] = await Promise.all([
    user
      ? db.message.count({
          where: {
            read: false,
            senderId: { not: user.id },
            inquiry: { OR: [{ renterId: user.id }, { hostId: user.id }] },
          },
        })
      : 0,
    getBrowserOrderTokens().then((t) => t.length),
  ]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1.5 xl:flex">
          {user ? (
            <>
              <Link href="/market/messages" className="relative rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-2">
                消息
                {unread > 0 && (
                  <span className="absolute -top-0.5 right-0 rounded-full bg-danger px-1.5 text-[10px] leading-4 text-white">{unread}</span>
                )}
              </Link>
              <Link href="/orders" className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-2">订单</Link>
              <Link href="/account" className="max-w-28 truncate rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-2">{user.name}</Link>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-outline btn-sm">后台</Link>}
              <form action={logoutAction}>
                <button className="btn-ghost btn-sm" type="submit">退出</button>
              </form>
            </>
          ) : (
            <>
              {guestOrders > 0 && <Link href="/orders" className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-surface-2">我的订单</Link>}
              <Link href="/login" className="btn-ghost">登录</Link>
            </>
          )}
          <Link href="/pricing#plans" className="btn-primary">立即开通</Link>
        </div>
        <MobileNav nav={NAV} loggedIn={!!user} isAdmin={user?.role === "ADMIN"} hasGuestOrders={guestOrders > 0} />
      </div>
    </header>
  );
}
