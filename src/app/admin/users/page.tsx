import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { HOST_STATUS } from "@/lib/constants";
import { date } from "@/lib/format";
import { Badge, Empty, PageHeader, Pager, StatusBadge } from "@/components/ui";
import { UserActions } from "@/components/admin/UserActions";

export const metadata = { title: "用户与房东" };
const PER = 30;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; hostStatus?: string; banned?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "", role = "", hostStatus = "", banned = "", page: p = "1" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { wechat: { contains: q } }] } : {}),
    ...(role ? { role } : {}),
    ...(hostStatus ? { hostStatus } : {}),
    ...(banned ? { banned: banned === "1" } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { _count: { select: { orders: true, listings: true } } },
      orderBy: hostStatus === "PENDING" ? { createdAt: "asc" } : { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    db.user.count({ where }),
  ]);
  const qs = (n: number) => `/admin/users?${new URLSearchParams({ ...(q && { q }), ...(role && { role }), ...(hostStatus && { hostStatus }), ...(banned && { banned }), page: String(n) })}`;

  return (
    <div>
      <PageHeader title="用户与房东" desc={`共 ${total} 位`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="邮箱 / 昵称 / 微信" className="input w-56 py-1.5" />
        <select name="role" defaultValue={role} className="input w-auto py-1.5">
          <option value="">全部角色</option><option value="USER">普通用户</option><option value="ADMIN">管理员</option>
        </select>
        <select name="hostStatus" defaultValue={hostStatus} className="input w-auto py-1.5">
          <option value="">房东状态</option>
          {Object.entries(HOST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="banned" defaultValue={banned} className="input w-auto py-1.5">
          <option value="">账号状态</option><option value="0">正常</option><option value="1">已封禁</option>
        </select>
        <button className="btn-outline btn-sm">筛选</button>
        {(q || role || hostStatus || banned) && <Link href="/admin/users" className="btn-ghost btn-sm">清除</Link>}
      </form>

      {users.length === 0 ? (
        <Empty>没有符合条件的用户</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>用户</th><th>角色</th><th>房东</th><th>订单 / 方案</th><th>注册</th><th className="text-right">操作</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-brand hover:underline">{u.name}</Link>
                    {u.banned && <span className="ml-1.5"><Badge tone="danger">已封禁</Badge></span>}
                    <div className="text-xs text-muted">{u.email}{u.wechat ? ` · 微信 ${u.wechat}` : ""}</div>
                    {u.hostStatus === "PENDING" && u.hostIntro && <div className="mt-1 max-w-sm text-xs text-ink-soft">申请说明：{u.hostIntro}</div>}
                  </td>
                  <td>{u.role === "ADMIN" ? <Badge tone="info">管理员</Badge> : <span className="text-muted">用户</span>}</td>
                  <td><StatusBadge map={HOST_STATUS} value={u.hostStatus} /></td>
                  <td className="text-muted">{u._count.orders} / {u._count.listings}</td>
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
