import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { HOST_STATUS } from "@/lib/constants";
import { date } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui";
import { PasswordForm, ProfileForm } from "@/components/selfserve/AccountForms";

export const metadata = { title: "账户设置" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, listings, inquiries] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.listing.count({ where: { hostId: user.id } }),
    db.inquiry.count({ where: { OR: [{ renterId: user.id }, { hostId: user.id }] } }),
  ]);

  return (
    <div className="container-page py-12">
      <PageHeader title="账户设置" desc={`注册于 ${date(user.createdAt)}`} />
      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          <div className="card p-6">
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="mt-1 text-sm text-muted">{user.email}</div>
            <div className="mt-3"><StatusBadge map={HOST_STATUS} value={user.hostStatus} /></div>
            {user.hostStatus !== "VERIFIED" && (
              <Link href="/market/become-host" className="mt-4 block text-sm text-brand hover:underline">
                {user.hostStatus === "PENDING" ? "查看房东认证进度 →" : "有闲置 Mac？申请成为房东 →"}
              </Link>
            )}
          </div>
          <div className="card divide-y divide-line text-sm">
            {[
              ["/orders", "我的订单", orders],
              ["/messages", "站内消息", inquiries],
              ["/market/mine", "我发布的方案", listings],
            ].map(([href, label, n]) => (
              <Link key={href as string} href={href as string} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2">
                <span>{label}</span><span className="text-muted">{n} →</span>
              </Link>
            ))}
          </div>
        </aside>
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 font-semibold">基本资料</h2>
            <ProfileForm name={user.name} wechat={user.wechat ?? ""} email={user.email} />
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
