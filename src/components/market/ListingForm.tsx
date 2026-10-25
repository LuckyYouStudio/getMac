"use client";

import { useActionState } from "react";
import type { Listing } from "@prisma/client";
import { ADMIN_ACCESS, DEVICE_MODELS, NETWORK } from "@/lib/constants";
import { FormError } from "@/components/ui";
import { saveListingAction } from "@/app/(site)/market/actions";

const DEFAULT_DESC =
  "交付方式：\n使用限制：\n停电/死机处理：\n到期后数据处理：";

export function ListingForm({ listing }: { listing?: Listing }) {
  const [state, action, pending] = useActionState(saveListingAction, undefined);
  const v = listing;
  return (
    <form action={action} className="space-y-6">
      {v && <input type="hidden" name="id" value={v.id} />}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">基本信息</h2>
        <label className="block">
          <span className="label">方案标题</span>
          <input name="title" required minLength={4} maxLength={60} defaultValue={v?.title} className="input" placeholder="例如：Mac mini M4 16GB 西雅图" />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">国家/地区</span>
            <input name="country" required defaultValue={v?.country} className="input" placeholder="美国" />
          </label>
          <label className="block">
            <span className="label">州/省（选填）</span>
            <input name="region" defaultValue={v?.region ?? ""} className="input" placeholder="华盛顿州" />
          </label>
          <label className="block">
            <span className="label">城市（选填）</span>
            <input name="city" defaultValue={v?.city ?? ""} className="input" placeholder="西雅图" />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">设备与环境</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">设备型号</span>
            <select name="deviceModel" required defaultValue={v?.deviceModel ?? "Mac mini M4"} className="input">
              {DEVICE_MODELS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">内存（GB）</span>
            <input name="memory" type="number" min={1} required defaultValue={v?.memory ?? 16} className="input" />
          </label>
          <label className="block">
            <span className="label">硬盘（GB）</span>
            <input name="storage" type="number" min={1} required defaultValue={v?.storage ?? 256} className="input" />
          </label>
          <label className="block">
            <span className="label">账号权限</span>
            <select name="adminAccess" defaultValue={v?.adminAccess ?? "YES"} className="input">
              {Object.entries(ADMIN_ACCESS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">网络环境</span>
            <select name="network" defaultValue={v?.network ?? "HOME"} className="input">
              {Object.entries(NETWORK).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">价格与条件</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">币种</span>
            <select name="currency" defaultValue={v?.currency ?? "USD"} className="input">
              <option value="USD">美元 USD</option>
              <option value="CNY">人民币 ¥</option>
            </select>
          </label>
          <label className="block">
            <span className="label">月租</span>
            <input name="price" type="number" min={1} required defaultValue={v?.price} className="input" />
          </label>
          <label className="block">
            <span className="label">最短租期（月）</span>
            <input name="minMonths" type="number" min={1} max={24} required defaultValue={v?.minMonths ?? 1} className="input" />
          </label>
          <label className="block">
            <span className="label">首期金额</span>
            <input name="firstPayment" type="number" min={0} defaultValue={v?.firstPayment ?? 0} className="input" />
          </label>
          <label className="block">
            <span className="label">押金（无则填 0）</span>
            <input name="deposit" type="number" min={0} defaultValue={v?.deposit ?? 0} className="input" />
          </label>
          <label className="block">
            <span className="label">额外费用（选填）</span>
            <input name="extraFees" maxLength={100} defaultValue={v?.extraFees ?? ""} className="input" placeholder="例如：固定 IP 另加 $5/月" />
          </label>
        </div>
        <p className="hint">建议首期不超过一个月租金。要求大额预付的方案更容易被举报。</p>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-semibold">详细说明</h2>
        <textarea name="description" required minLength={20} maxLength={3000} rows={8} defaultValue={v?.description ?? DEFAULT_DESC} className="input" />
        <p className="hint">写清交付方式、维护响应、使用限制和到期后的数据处理。不要留站外联系方式。</p>
      </section>

      <FormError message={state?.error} />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary btn-lg" disabled={pending}>{pending ? "提交中…" : v ? "保存并重新提交审核" : "提交审核"}</button>
        <span className="text-sm text-muted">提交后进入审核，通过后公开展示。</span>
      </div>
    </form>
  );
}
