import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ago } from "@/lib/format";
import { Badge, Empty, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ReportForm, ReportResult } from "@/components/market/ReportForm";
import { closeWantedAction, createWantedAction } from "../actions";

export const metadata = { title: "求租 · 租赁市场" };

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ posted?: string; err?: string; report?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const posts = await db.wantedPost.findMany({
    where: { OR: [{ status: "OPEN" }, ...(user ? [{ userId: user.id, status: "CLOSED" }] : [])] },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 100,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <PageHeader title="求租" desc="没找到合适的设备？说说你的需求，房东看到会在站内联系你。" />
        <div className="mb-4 space-y-2">
          {sp.posted && <Notice tone="ok">求租已发布。</Notice>}
          <ReportResult value={sp.report} />
        </div>
        {posts.length === 0 ? (
          <Empty>暂时没有求租信息。</Empty>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <article key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold">{p.title}</h2>
                  {p.status === "OPEN" ? <Badge tone="ok">求租中</Badge> : <Badge>已找到</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">
                  地区 {p.region || "不限"} · 预算 {p.budget || "面议"} · {p.user.name} · {ago(p.createdAt)}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{p.requirements}</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  {user?.id === p.userId ? (
                    p.status === "OPEN" ? (
                      <form action={closeWantedAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <SubmitButton className="btn-outline btn-sm" confirm="标记为已找到并关闭这条求租？">已找到，关闭</SubmitButton>
                      </form>
                    ) : <span />
                  ) : (
                    <ReportForm targetType="WANTED" targetId={p.id} returnTo="/market/wanted" />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside id="new" className="scroll-mt-24 space-y-4">
        <div className="card p-5">
          <h2 className="font-semibold">发布求租</h2>
          {user ? (
            <form action={createWantedAction} className="mt-4 space-y-3">
              <label className="block">
                <span className="label">标题</span>
                <input name="title" required minLength={4} maxLength={60} className="input" placeholder="求租美西 Mac mini M4 16G" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="label">地区</span>
                  <input name="region" maxLength={30} className="input" placeholder="不限" />
                </label>
                <label className="block">
                  <span className="label">预算</span>
                  <input name="budget" maxLength={30} className="input" placeholder="USD 100/月" />
                </label>
              </div>
              <label className="block">
                <span className="label">具体需求</span>
                <textarea name="requirements" required minLength={10} maxLength={2000} rows={5} className="input" placeholder="用途、配置、权限、租期…" />
              </label>
              {sp.err && <p className="text-sm text-danger">标题至少 4 字，需求至少 10 字。</p>}
              <SubmitButton className="btn-primary w-full" pendingText="发布中…">发布</SubmitButton>
              <p className="hint">请勿留站外联系方式，房东会通过站内联系你。</p>
            </form>
          ) : (
            <Link href="/login?next=/market/wanted" className="btn-primary mt-4 w-full">登录后发布</Link>
          )}
        </div>
        <Notice tone="warn">遇到要求先付大额定金、或引导到站外交易的情况，请谨慎并举报。</Notice>
      </aside>
    </div>
  );
}
