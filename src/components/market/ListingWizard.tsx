"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useKeepValuesSubmit } from "@/components/useKeepValuesSubmit";
import type { Listing } from "@prisma/client";
import { saveListingAction } from "@/app/(site)/market/_actions/listings";
import {
  ADMIN_ACCESS, AVAILABILITY, CHIPS, COUNTRIES, MACHINE_TYPES, MEMORY_OPTIONS, MIN_MONTH_OPTIONS,
  NETWORK, REMOTE_METHODS, RESTART, STORAGE_OPTIONS,
} from "@/lib/constants";
import { FormError } from "@/components/ui";

const STEPS = ["基础配置", "地点与网络", "使用条件", "费用", "服务约定", "确认发布"];

function F({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function ListingWizard({ listing }: { listing?: Listing | null }) {
  const [state, action, pending] = useActionState(saveListingAction, undefined);
  const submit = useKeepValuesSubmit(action);
  const [step, setStep] = useState(1);
  const [avail, setAvail] = useState(listing?.availability ?? "AVAILABLE");
  useEffect(() => {
    if (state?.step) setStep(state.step);
  }, [state]);

  const l = listing;
  const remote: string[] = l ? JSON.parse(l.remoteMethods || "[]") : ["UU"];
  const canDraft = !l || l.status === "DRAFT";
  const show = (n: number) => (step === n ? "" : "hidden");
  const dateVal = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <form onSubmit={submit} className="space-y-6">
      {l && <input type="hidden" name="id" value={l.id} />}

      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStep(i + 1)}
              className={`rounded-full px-3 py-1.5 ${step === i + 1 ? "bg-brand text-white" : step > i + 1 ? "bg-safe-soft text-safe" : "bg-surface-2 text-muted"}`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="card p-6">
        <div className={`grid gap-4 sm:grid-cols-2 ${show(1)}`}>
          <F label="标题 *" hint="写清机型、配置和城市，不要写联系方式" wide>
            <input name="title" defaultValue={l?.title} maxLength={60} className="input" placeholder="如：Mac mini M4 16GB 西雅图" />
          </F>
          <F label="机型 *">
            <select name="machineType" defaultValue={l?.machineType ?? "Mac mini"} className="input">
              {MACHINE_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </F>
          <F label="芯片 *">
            <select name="chip" defaultValue={l?.chip ?? "M4"} className="input">
              {[...CHIPS, "其他"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="内存 *">
            <select name="memory" defaultValue={l?.memory ?? 16} className="input">
              {MEMORY_OPTIONS.map((m) => <option key={m} value={m}>{m}GB</option>)}
            </select>
          </F>
          <F label="硬盘 *">
            <select name="storage" defaultValue={l?.storage ?? 256} className="input">
              {STORAGE_OPTIONS.map((m) => <option key={m} value={m}>{m >= 1024 ? `${m / 1024}TB` : `${m}GB`}</option>)}
            </select>
          </F>
          <F label="系统版本">
            <input name="osVersion" defaultValue={l?.osVersion ?? ""} maxLength={30} className="input" placeholder="如 macOS 26" />
          </F>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 ${show(2)}`}>
          <F label="国家/地区 *">
            <select name="country" defaultValue={l?.country ?? "US"} className="input">
              {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="州/省">
            <input name="region" defaultValue={l?.region ?? ""} maxLength={30} className="input" placeholder="如 加利福尼亚州" />
          </F>
          <F label="城市" hint="只写到城市，不要写街道地址">
            <input name="city" defaultValue={l?.city ?? ""} maxLength={30} className="input" />
          </F>
          <F label="网络类型 *">
            <select name="network" defaultValue={l?.network ?? "HOME"} className="input">
              {Object.entries(NETWORK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="带宽" hint="自己测的就行，如 1000M 下 / 40M 上" wide>
            <input name="bandwidth" defaultValue={l?.bandwidth ?? ""} maxLength={40} className="input" />
          </F>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 ${show(3)}`}>
          <F label="管理员权限 *">
            <select name="adminAccess" defaultValue={l?.adminAccess ?? "YES"} className="input">
              {Object.entries(ADMIN_ACCESS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <F label="远程重启">
            <select name="restart" defaultValue={l?.restart ?? "UNSTATED"} className="input">
              {Object.entries(RESTART).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          <fieldset className="sm:col-span-2">
            <span className="label">远程方式 *（可多选）</span>
            <div className="flex flex-wrap gap-3 text-sm">
              {REMOTE_METHODS.map((m) => (
                <label key={m} className="flex items-center gap-1.5">
                  <input type="checkbox" name="remoteMethods" value={m} defaultChecked={remote.includes(m)} /> {m}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="selfInstall" defaultChecked={l?.selfInstall ?? true} /> 允许租客自行安装软件
          </label>
          <F label="档期 *">
            <select name="availability" value={avail} onChange={(e) => setAvail(e.target.value)} className="input">
              {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </F>
          {avail === "FROM_DATE" && (
            <F label="从哪天起可咨询">
              <input name="availableFrom" type="date" defaultValue={dateVal(l?.availableFrom)} className="input" />
            </F>
          )}
          <p className="text-xs text-muted sm:col-span-2">市场只接受整机独占、按月起租的出租方式，不接受共享账号或按小时出租。</p>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 ${show(4)}`}>
          <F label="币种 *">
            <select name="currency" defaultValue={l?.currency ?? "USD"} className="input">
              <option value="USD">美元 USD</option>
              <option value="CNY">人民币 ¥</option>
            </select>
          </F>
          <F label="月租 *">
            <input name="price" type="number" min={1} defaultValue={l?.price || ""} className="input" />
          </F>
          <F label="最短租期 *">
            <select name="minMonths" defaultValue={l?.minMonths ?? 1} className="input">
              {MIN_MONTH_OPTIONS.map((m) => <option key={m} value={m}>{m} 个月</option>)}
            </select>
          </F>
          <F label="首期" hint="开始前需要先付的金额，0 表示不用">
            <input name="firstPayment" type="number" min={0} defaultValue={l?.firstPayment ?? 0} className="input" />
          </F>
          <F label="押金">
            <input name="deposit" type="number" min={0} defaultValue={l?.deposit ?? 0} className="input" />
          </F>
          <F label="额外费用">
            <input name="extraFees" defaultValue={l?.extraFees ?? ""} maxLength={100} className="input" placeholder="没有就留空" />
          </F>
          <F label="付款方式" wide>
            <input name="paymentMethods" defaultValue={l?.paymentMethods ?? ""} maxLength={100} className="input" placeholder="如 PayPal / 支付宝" />
          </F>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 ${show(5)}`}>
          <F label="响应时间">
            <input name="supportHours" defaultValue={l?.supportHours ?? ""} maxLength={60} className="input" placeholder="如 北京时间 9:00–23:00" />
          </F>
          <F label="房东网站" hint="可选，以 https:// 开头">
            <input name="hostWebsite" defaultValue={l?.hostWebsite ?? ""} maxLength={200} className="input" />
          </F>
          <F label="交付说明" wide>
            <textarea name="deliveryNotes" defaultValue={l?.deliveryNotes ?? ""} maxLength={300} rows={2} className="input" placeholder="付款后多久交付、首次连接怎么协助" />
          </F>
          <F label="退款约定" wide>
            <textarea name="refundPolicy" defaultValue={l?.refundPolicy ?? ""} maxLength={300} rows={2} className="input" />
          </F>
          <F label="到期数据处理" wide>
            <input name="dataCleanup" defaultValue={l?.dataCleanup ?? ""} maxLength={200} className="input" placeholder="如 到期后整盘抹除并重装" />
          </F>
          <F label="详细说明 *" hint="至少 20 字。写清机器状况、使用限制。不能留微信、电话、邮箱等联系方式。" wide>
            <textarea name="description" defaultValue={l?.description} maxLength={3000} rows={6} className="input" />
          </F>
        </div>

        <div className={`space-y-4 ${show(6)}`}>
          <p className="text-sm text-ink-soft">
            发布后方案立即公开，平台会在之后复查；如需修改，平台会说明原因。方案每 14 天需要确认一次仍可租，否则自动过期。
            每个账号最多同时有 3 个有效方案。
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="agreeRules" className="mt-1" />
            <span>
              我确认以上信息属实，公开内容里没有联系方式，并会遵守
              <Link href="/market/rules" target="_blank" className="text-brand hover:underline">市场规则</Link>。
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="agreeLicense" className="mt-1" />
            <span>我出租的是整台机器，由一位租客独占使用，符合 macOS 软件许可的要求。</span>
          </label>
        </div>
      </div>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 1 && <button type="button" className="btn-outline" onClick={() => setStep(step - 1)}>上一步</button>}
          {step < STEPS.length && <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>下一步</button>}
        </div>
        <div className="flex gap-2">
          {canDraft && (
            <button type="submit" name="intent" value="draft" className="btn-ghost" disabled={pending}>存为草稿</button>
          )}
          {step === STEPS.length && (
            <button type="submit" name="intent" value="publish" className="btn-safe" disabled={pending}>
              {pending ? "提交中…" : l && l.status !== "DRAFT" ? "保存修改" : "发布方案"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
