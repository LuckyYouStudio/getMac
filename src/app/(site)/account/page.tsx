import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { date } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/selfserve/AccountForms";

export const metadata = { title: "账户设置" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, listings, inquiries, machines] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.listing.count({ where: { hostId: user.id, status: { not: "REMOVED" } } }),
    db.inquiry.count({ where: { OR: [{ renterId: user.id }, { hostId: user.id }] } }),
    db.machine.count({ where: { ownerId: user.id } }),
  ]);

  const links: [string, string, number | null][] = [
    ["/orders", "我的订单（自营）", orders],
    ["/messages", "站内消息", inquiries],
    ["/market/mine", "我在市场发布的方案", listings],
    [`/market/hosts/${user.id}`, "我的公开主页", null],
    ...(user.officialHost ? ([["/ops", "官方房东后台", machines]] as [string, string, number][]) : []),
  ];

  return (
    <div className="container-page py-12">
      <PageHeader title="账户设置" desc={`注册于 ${date(user.createdAt)}`} />
      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <div className="card p-6">
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="mt-1 text-sm text-muted">{user.email}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.role === "ADMIN" && <Badge tone="info">管理员</Badge>}
              {user.officialHost && <Badge tone="ok">官方房东</Badge>}
              {user.restricted && <Badge tone="warn">账号受限</Badge>}
            </div>
            {user.restricted && (
              <p className="mt-3 text-xs leading-5 text-warn">账号目前受限：可以回复已有对话，暂时不能发起新咨询或发布内容。如有疑问请联系 {""}<Link className="underline" href="/apply">我们</Link>。</p>
            )}
            {!user.officialHost && (
              <div className="mt-4 space-y-1.5 text-sm">
                <Link href="/market/become-host" className="block text-brand hover:underline">在租赁市场出租自己的 Mac →</Link>
                <Link href="/join" className="block text-brand hover:underline">成为官方房东，我们负责找租客 →</Link>
              </div>
            )}
          </div>
          <div className="card divide-y divide-line text-sm">
            {links.map(([href, label, n]) => (
              <Link key={href} href={href} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2">
                <span>{label}</span><span className="text-muted">{n ?? ""} →</span>
              </Link>
            ))}
          </div>
        </aside>
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">基本资料</h2>
            <ProfileForm name={user.name} wechat={user.wechat ?? ""} bio={user.bio ?? ""} email={user.email} />
          </section>
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">修改密码</h2>
            <PasswordForm />
          </section>
        </div>
      </div>
    </div>
  );
}
