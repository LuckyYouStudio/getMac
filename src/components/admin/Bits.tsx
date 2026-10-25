import Link from "next/link";
import type { ReactNode } from "react";

/** 详情页的“键 / 值”格 */
export function Info({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{k}</div>
      <div className="mt-0.5 break-words">{v}</div>
    </div>
  );
}

/** 订单的下单人：注册用户链接到用户详情，游客显示联系人与邮箱 */
export function OrderBuyer({
  user, contactName, email,
}: {
  user: { id: string; name: string; email: string } | null;
  contactName: string | null;
  email: string;
}) {
  if (user) {
    return (
      <>
        <Link href={`/admin/users/${user.id}`} className="hover:text-brand">{user.name}</Link>
        <div className="text-xs text-muted">{user.email}</div>
      </>
    );
  }
  return (
    <>
      {contactName || "游客"} <span className="rounded bg-surface-2 px-1 text-[10px] text-muted">游客</span>
      <div className="text-xs text-muted">{email}</div>
    </>
  );
}

/** 心跳新鲜度：5 分钟内在线，1 小时内延迟，否则离线 */
export function Heartbeat({ at }: { at: Date | null }) {
  if (!at) return <span className="text-xs text-muted">未上报</span>;
  const min = Math.floor((Date.now() - at.getTime()) / 60000);
  const [cls, label] =
    min <= 5 ? ["bg-safe", `在线 · ${min} 分钟前`] : min <= 60 ? ["bg-warn", `延迟 · ${min} 分钟前`] : ["bg-danger", `离线 · ${Math.floor(min / 60)} 小时前`];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      {label}
    </span>
  );
}
