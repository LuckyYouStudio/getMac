import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHIPS, COUNTRIES, MARKET_LIMITS, MEMORY_OPTIONS, REMOTE_METHODS } from "@/lib/constants";
import { Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { createWantedAction } from "../../_actions/wanted";

export const metadata = { title: "发布求租" };

export default async function NewWantedPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/market/wanted/new");
  const active = await db.wantedPost.count({ where: { userId: user.id, status: "OPEN" } });
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="发布求租" desc="写清楚你需要什么，有合适机器的房东会在站内回应。不要留联系方式。" />
      <Flash err={sp.err} />
      {user.restricted ? (
        <Notice tone="warn">你的账号目前受限，不能发布求租。</Notice>
      ) : active >= MARKET_LIMITS.maxActiveWanted ? (
        <Notice tone="warn">你已经有 {active} 条征集中的求租，请先到<Link href="/market/mine" className="underline">我的方案</Link>关闭旧的。</Notice>
      ) : (
        <form action={createWantedAction} className="card mt-4 grid gap-4 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label">标题 *</span>
            <input name="title" required minLength={4} maxLength={60} className="input" placeholder="如：求美西 Mac mini M4 16G，跑 Xcode 打包" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">用途 *</span>
            <input name="purpose" required maxLength={60} className="input" placeholder="如：iOS 打包上架、AI 编程" />
          </label>
          <label>
            <span className="label">最低芯片</span>
            <select name="chipMin" className="input" defaultValue="">
              <option value="">不限</option>
              {CHIPS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span className="label">最低内存</span>
            <select name="memMin" className="input" defaultValue="">
              <option value="">不限</option>
              {MEMORY_OPTIONS.map((m) => <option key={m} value={m}>{m}GB</option>)}
            </select>
          </label>
          <label>
            <span className="label">国家/地区</span>
            <select name="country" className="input" defaultValue="">
              <option value="">不限</option>
              {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            <span className="label">州/省/区域</span>
            <input name="region" maxLength={30} className="input" placeholder="如 西海岸" />
          </label>
          <label>
            <span className="label">预算下限（USD/月）</span>
            <input name="budgetMin" type="number" min={1} className="input" />
          </label>
          <label>
            <span className="label">预算上限（USD/月）</span>
            <input name="budgetMax" type="number" min={1} className="input" />
          </label>
          <label>
            <span className="label">希望开始日期</span>
            <input name="startDate" type="date" min={today} max={max} className="input" />
          </label>
          <label>
            <span className="label">预计租期（月）*</span>
            <input name="termMonths" type="number" min={1} max={36} defaultValue={1} required className="input" />
          </label>
          <fieldset className="sm:col-span-2">
            <span className="label">能接受的远程方式</span>
            <div className="flex flex-wrap gap-3 text-sm">
              {REMOTE_METHODS.map((m) => (
                <label key={m} className="flex items-center gap-1.5"><input type="checkbox" name="remoteMethods" value={m} /> {m}</label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="adminNeeded" /> 需要管理员权限
          </label>
          <label className="sm:col-span-2">
            <span className="label">详细需求 *</span>
            <textarea name="description" required minLength={10} maxLength={1500} rows={5} className="input" placeholder="比如需要 24 小时开机、要能装 Docker、几个人用…" />
          </label>
          <div className="flex justify-end sm:col-span-2">
            <SubmitButton pendingText="发布中…">发布求租</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
