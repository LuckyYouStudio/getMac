import { db } from "@/lib/db";
import { CYCLES, LEAD_STATUS, type Cycle } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/admin/Tabs";
import { updateLead } from "../actions/business";

export const metadata = { title: "线索" };

const PLAN_LABEL: Record<string, string> = { economy: "经济", standard: "标准", pro: "进阶", custom: "定制配置", unsure: "不确定" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const [leads, counts] = await Promise.all([
    db.lead.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200 }),
    db.lead.groupBy({ by: ["status"], _count: true }),
  ]);
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <div>
      <PageHeader title="线索" desc="来自“联系我们 / 定制配置”表单。承诺 1 个工作日内回复。" />
      <Tabs
        current={status}
        tabs={[
          { key: "", label: "全部", href: "/admin/leads", count: total },
          ...Object.entries(LEAD_STATUS).map(([k, v]) => ({
            key: k, label: v.label, href: `/admin/leads?status=${k}`, count: counts.find((c) => c.status === k)?._count ?? 0,
          })),
        ]}
      />
      {leads.length === 0 ? (
        <Empty>没有线索</Empty>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => {
            const contacts = [
              l.phone && `电话 ${l.phoneCountry ?? ""} ${l.phone}`,
              l.email && `邮箱 ${l.email}`,
              l.wechat && `微信 ${l.wechat}`,
            ].filter(Boolean);
            const custom = [l.chip, l.memory, l.storage, l.qty && `${l.qty} 台`, l.term].filter(Boolean);
            return (
              <div key={l.id} className="card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-muted">#{l.seq}</span>
                    <h3 className="font-semibold">{l.name}</h3>
                    <StatusBadge map={LEAD_STATUS} value={l.status} />
                    <span className="text-xs text-muted">{dateTime(l.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-ink-soft">{contacts.join(" · ") || "未留联系方式"}</p>
                  <p className="mt-1 text-muted">
                    团队 {l.teamSize}
                    {l.plan && ` · 意向 ${PLAN_LABEL[l.plan] ?? l.plan}`}
                    {l.cycle && ` · ${CYCLES[l.cycle as Cycle]?.label ?? l.cycle}`}
                    {l.startWhen && ` · 希望 ${l.startWhen} 开始`}
                  </p>
                  {custom.length > 0 && <p className="mt-1 text-muted">定制：{custom.join(" · ")}</p>}
                  <p className="mt-3 rounded-lg bg-surface-2 p-3 whitespace-pre-line text-ink-soft">{l.usage}</p>
                </div>
                <form action={updateLead} className="space-y-2 border-line lg:border-l lg:pl-4">
                  <input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="input">
                    {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <textarea name="note" rows={3} className="input text-xs" defaultValue={l.note ?? ""} placeholder="跟进记录（仅后台可见）" />
                  <SubmitButton className="btn-outline btn-sm w-full">保存</SubmitButton>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
