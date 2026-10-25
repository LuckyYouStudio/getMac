import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { date } from "@/lib/format";
import { Badge, Empty, PageHeader, Pager } from "@/components/ui";
import { UserActions } from "@/components/admin/UserActions";

export const metadata = { title: "用户与房东" };
const PER = 30;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; state?: string; host?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "", role = "", state = "", host = "", page: p = "1" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { wechat: { contains: q } }] } : {}),
    ...(role ? { role } : {}),
    ...(state === "active" ? { banned: false, restricted: false } : state === "restricted" ? { restricted: true, banned: false } : state === "banned" ? { banned: true } : {}),
    ...(host === "official" ? { officialHost: true } : host === "market" ? { listings: { some: {} } } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { _count: { select: { orders: true, listings: true, ownedMachines: true, reports: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    db.user.count({ where }),
  ]);
  const qs = (n: number) =>
    `/admin/users?${new URLSearchParams({ ...(q && { q }), ...(role && { role }), ...(state && { state }), ...(host && { host }), page: String(n) })}`;

  return (
    <div>
      <PageHeader title="用户与房东" desc={`共 ${total} 位 · 受限：只能回复已有对话；暂停：无法登录`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="邮箱 / 昵称 / 微信" className="input w-56 py-1.5" />
        <select name="role" defaultValue={role} className="input w-auto py-1.5">
          <option value="">全部角色</option><option value="USER">普通用户</option><option value="ADMIN">管理员</option>
        </select>
        <select name="host" defaultValue={host} className="input w-auto py-1.5">
          <option value="">全部用户</option><option value="official">官方房东</option><option value="market">市场房东（发过方案）</option>
        </select>
        <select name="state" defaultValue={state} className="input w-auto py-1.5">
          <option value="">账号状态</option><option value="active">正常</option><option value="restricted">受限</option><option value="banned">暂停</option>
        </select>
        <button className="btn-outline btn-sm">筛选</button>
        {(q || role || state || host) && <Link href="/admin/users" className="btn-ghost btn-sm">清除</Link>}
      </form>

      {users.length === 0 ? (
        <Empty>没有符合条件的用户</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>用户</th><th>身份</th><th>订单 / 方案 / 托管机器</th><th>注册</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-brand hover:underline">{u.name}</Link>
                    {u.banned && <span className="ml-1.5"><Badge tone="danger">暂停</Badge></span>}
                    {u.restricted && !u.banned && <span className="ml-1.5"><Badge tone="warn">受限</Badge></span>}
                    <div className="text-xs text-muted">{u.email}{u.wechat ? ` · 微信 ${u.wechat}` : ""}</div>
                  </td>
                  <td className="space-x-1">
                    {u.role === "ADMIN" && <Badge tone="info">管理员</Badge>}
                    {u.officialHost && <Badge tone="ok">官方房东</Badge>}
                    {u._count.listings > 0 && <Badge>市场房东</Badge>}
                    {u.role !== "ADMIN" && !u.officialHost && !u._count.listings && <span className="text-muted">用户</span>}
                  </td>
                  <td className="text-muted">{u._count.orders} / {u._count.listings} / {u._count.ownedMachines}</td>
                  <td className="text-muted">{date(u.createdAt)}</td>
                  <td><UserActions user={u} selfId={admin.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} totalPages={Math.ceil(total / PER)} href={qs} />
    </div>
  );
}
