import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { AdminNav, type NavGroup } from "@/components/admin/AdminNav";

export const metadata = { title: { default: "后台管理", template: `%s · ${SITE.name} 后台` } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [toProvision, newLeads, openRestock, onboarding, pendingPayouts, needsChanges, openReports, pendingPosts, proposedDeals] =
    await Promise.all([
      db.order.count({ where: { status: { in: ["PAID", "PROVISIONING"] } } }),
      db.lead.count({ where: { status: "NEW" } }),
      db.restockAlert.count({ where: { status: "OPEN" } }),
      db.machine.count({ where: { status: "ONBOARDING" } }),
      db.payout.count({ where: { status: "PENDING" } }),
      db.listing.count({ where: { status: "NEEDS_CHANGES" } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.communityPost.count({ where: { status: "PENDING" } }),
      db.deal.count({ where: { status: "PROPOSED" } }),
    ]);

  const groups: NavGroup[] = [
    { title: "概览", items: [{ href: "/admin", label: "数据看板" }] },
    {
      title: "自营业务",
      items: [
        { href: "/admin/orders", label: "订单", count: toProvision },
        { href: "/admin/machines", label: "设备", count: onboarding },
        { href: "/admin/plans", label: "方案" },
        { href: "/admin/restock", label: "到货通知", count: openRestock },
        { href: "/admin/leads", label: "线索", count: newLeads },
        { href: "/admin/payouts", label: "官方房东结算", count: pendingPayouts },
      ],
    },
    {
      title: "C2C 市场",
      items: [
        { href: "/admin/listings", label: "出租方案", count: needsChanges },
        { href: "/admin/wanted", label: "求租帖" },
        { href: "/admin/reports", label: "举报", count: openReports },
        { href: "/admin/community", label: "交流区", count: pendingPosts },
        { href: "/admin/inquiries", label: "对话记录" },
        { href: "/admin/deals", label: "成交与评价", count: proposedDeals },
      ],
    },
    { title: "用户", items: [{ href: "/admin/users", label: "用户与房东" }] },
    {
      title: "内容",
      items: [
        { href: "/admin/faq", label: "FAQ" },
        { href: "/admin/announcements", label: "公告" },
      ],
    },
  ];

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-navy px-4 pt-4 pb-2 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:overflow-y-auto md:py-5">
        <Link href="/admin" className="mb-4 flex items-center gap-2 px-1 md:mb-6 md:px-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-safe text-xs font-bold text-white">GM</span>
          <span className="font-semibold text-white">{SITE.name} 后台</span>
        </Link>
        <AdminNav groups={groups} />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
          <span className="text-sm text-muted">
            你好，<span className="font-medium text-ink">{admin.name}</span>
          </span>
          <Link href="/" className="btn-outline btn-sm">回到前台 →</Link>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
