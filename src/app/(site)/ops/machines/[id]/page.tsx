import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MACHINE_STATUS } from "@/lib/constants";
import { ago } from "@/lib/format";
import { parseJson } from "@/lib/json";
import { CheckIcon, Field, FormError, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyBlock } from "@/components/official/CopyBlock";
import { MachineSpecFields } from "@/components/official/MachineSpecFields";
import { CHECKLIST, isOnline } from "@/components/official/checklist";
import {
  regenerateTokenAction,
  submitForReviewAction,
  toggleChecklistAction,
  updateMachineAction,
} from "../../actions";

export const metadata = { title: "管理机器" };

export default async function OpsMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; submitted?: string }>;
}) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, requireUser("/ops")]);
  const m = await db.machine.findUnique({ where: { id }, include: { plan: true } });
  if (!m || m.ownerId !== user.id) notFound();
  const plans = await db.plan.findMany({ where: { active: true }, orderBy: { sort: "asc" } });

  const list = parseJson<Record<string, boolean>>(m.checklist, {});
  const checked = (key: string, auto?: boolean) => (auto ? !!m.heartbeatAt : !!list[key]);
  const allDone = CHECKLIST.every((c) => checked(c.key, c.auto));
  const onboarding = m.status === "ONBOARDING";
  const rented = m.status === "RENTED";

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const endpoint = `${proto}://${host}/api/heartbeat`;
  const curl = `curl -fsS -X POST -H 'Content-Type: application/json' -d '{"token":"${m.heartbeatToken}"}' ${endpoint}`;
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.getmac.heartbeat</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/curl</string><string>-fsS</string><string>-X</string><string>POST</string>
    <string>-H</string><string>Content-Type: application/json</string>
    <string>-d</string><string>{"token":"${m.heartbeatToken}"}</string>
    <string>${endpoint}</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
</dict>
</plist>`;
  const install = `sudo nano /Library/LaunchDaemons/com.getmac.heartbeat.plist   # 粘贴上面的内容并保存
sudo chown root:wheel /Library/LaunchDaemons/com.getmac.heartbeat.plist
sudo launchctl bootstrap system /Library/LaunchDaemons/com.getmac.heartbeat.plist`;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ops" className="text-sm text-muted hover:text-brand">← 回到概览</Link>
        <PageHeader
          title={m.name}
          desc={`${m.location} · ${m.chip} · ${m.memory}GB · ${m.plan.name}档`}
          actions={<StatusBadge map={MACHINE_STATUS} value={m.status} />}
        />
      </div>

      {sp.saved && <Notice tone="ok">已保存。</Notice>}
      {sp.submitted && <Notice tone="ok">已提交上架审核。我们会在 1–2 个工作日内远程验收，通过后机器状态会变为“空闲”并开始出租。</Notice>}
      <FormError message={sp.error} />
      {rented && <Notice tone="info">这台机器正在出租中，只能修改备注。请保持通电联网，不要登录租客的环境。</Notice>}

      {/* 上架清单 */}
      {onboarding && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">上架清单</h2>
            {list.submitted && <span className="text-sm text-brand">已提交，等待验收</span>}
          </div>
          <ul className="mt-4 divide-y divide-line">
            {CHECKLIST.map((c) => {
              const on = checked(c.key, c.auto);
              return (
                <li key={c.key} className="flex items-start gap-3 py-3">
                  {c.auto ? (
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-safe bg-safe text-white" : "border-line-strong"}`}>
                      {on && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                  ) : (
                    <form action={toggleChecklistAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="key" value={c.key} />
                      <button
                        type="submit"
                        aria-label={on ? `取消勾选 ${c.label}` : `勾选 ${c.label}`}
                        className={`mt-0.5 grid h-5 w-5 place-items-center rounded border ${on ? "border-safe bg-safe text-white" : "border-line-strong hover:border-brand"}`}
                      >
                        {on && <CheckIcon className="h-3.5 w-3.5" />}
                      </button>
                    </form>
                  )}
                  <div>
                    <div className={`text-sm font-medium ${on ? "text-ink" : "text-ink-soft"}`}>
                      {c.label}
                      {c.auto && <span className="ml-2 text-xs font-normal text-muted">自动检测</span>}
                    </div>
                    <div className="text-xs leading-5 text-muted">{c.hint}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <form action={submitForReviewAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <input type="hidden" name="id" value={m.id} />
            <button type="submit" className="btn-safe" disabled={!allDone || !m.deliveryCredential || !!list.submitted}>
              {list.submitted ? "已提交审核" : "提交上架审核"}
            </button>
            <span className="text-xs text-muted">
              {!allDone ? "完成所有清单项后可提交。" : !m.deliveryCredential ? "还需要在下方填写交付凭据。" : "提交后由我们远程验收并上架。"}
            </span>
          </form>
        </section>
      )}

      {/* 运维脚本 */}
      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">运维脚本（心跳）</h2>
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${isOnline(m.heartbeatAt) ? "bg-safe" : m.heartbeatAt ? "bg-danger" : "bg-line-strong"}`} />
            {m.heartbeatAt ? `最近一次 ${ago(m.heartbeatAt)}` : "尚未收到心跳"}
          </span>
        </div>
        <p className="text-sm leading-6 text-ink-soft">
          脚本每 5 分钟向 GetMac 报告一次“我在线”，不上传任何文件或使用数据。先在机器的终端里运行下面一行测试，看到 <code className="font-mono">{"{\"ok\":true}"}</code> 就说明通了：
        </p>
        <CopyBlock label="测试一次" code={curl} />
        <p className="text-sm text-ink-soft">然后保存为系统服务，开机自动运行（不需要登录用户）：</p>
        <CopyBlock label="/Library/LaunchDaemons/com.getmac.heartbeat.plist" code={plist} />
        <CopyBlock label="安装" code={install} />
        <form action={regenerateTokenAction} className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <input type="hidden" name="id" value={m.id} />
          <span>令牌泄露了？</span>
          <SubmitButton className="btn-outline btn-sm" confirm="重置后旧令牌立即失效，需要重新安装脚本。确定重置？">重置令牌</SubmitButton>
        </form>
      </section>

      {/* 配置与交付凭据 */}
      <section className="card p-6">
        <h2 className="mb-4 font-semibold text-ink">配置与交付凭据</h2>
        <form action={updateMachineAction} className="space-y-5">
          <input type="hidden" name="id" value={m.id} />
          <MachineSpecFields plans={plans} d={m} disabled={rented} />
          <Field label="交付凭据" hint="只有 GetMac 管理员能看到，用于验收和交付给租客。例如 UU 设备码、getmac-ops 账号的密码。">
            <textarea
              name="deliveryCredential"
              className="input min-h-24 font-mono"
              defaultValue={m.deliveryCredential ?? ""}
              disabled={rented}
              placeholder={"UU 设备码：\ngetmac-ops 密码："}
            />
          </Field>
          <Field label="备注（给 GetMac 看的）" hint="例如计划停电时间、宽带变更。">
            <textarea name="notes" className="input min-h-20" defaultValue={m.notes ?? ""} maxLength={500} />
          </Field>
          <SubmitButton>保存</SubmitButton>
        </form>
      </section>
    </div>
  );
}
