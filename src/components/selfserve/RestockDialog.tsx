"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useKeepValuesSubmit } from "@/components/useKeepValuesSubmit";
import { FormError } from "@/components/ui";
import { createRestockAlertAction } from "@/app/(site)/pricing/actions";

const COUNTRY_CODES = ["+86", "+1", "+852", "+853", "+886", "+65", "+81", "+82", "+44", "+49", "+61"];

/** “到货通知我”按钮 + 弹窗 */
export function RestockDialog({
  plan,
  planName,
  defaultOpen = false,
  className = "btn-primary w-full",
}: {
  plan: string;
  planName: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(createRestockAlertAction, undefined);
  const submit = useKeepValuesSubmit(action);

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
  }, [defaultOpen]);

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>到货通知我</button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,440px)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-navy/50"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{planName}档到货通知</h3>
              <p className="mt-1 text-sm text-muted">这一档暂时没有空闲机器。留个联系方式，有货时第一时间告诉你。</p>
            </div>
            <button type="button" aria-label="关闭" className="text-muted hover:text-ink" onClick={() => ref.current?.close()}>✕</button>
          </div>

          {state?.ok ? (
            <div className="mt-6 rounded-xl bg-safe-soft p-4 text-sm leading-6 text-safe">
              已登记。到货后我们会按你留的方式联系你，先到先得，不需要预付。
              <div className="mt-3 flex gap-2">
                <Link href="/market" className="btn-outline btn-sm">先看看租赁市场</Link>
                <button type="button" className="btn-ghost btn-sm" onClick={() => ref.current?.close()}>关闭</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input type="hidden" name="plan" value={plan} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <div>
                <span className="label">电话</span>
                <div className="flex gap-2">
                  <select name="phoneCountry" className="input w-24 shrink-0" defaultValue="+86">
                    {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input name="phone" inputMode="tel" className="input" placeholder="手机号" />
                </div>
              </div>
              <label className="block"><span className="label">邮箱</span><input name="email" type="email" className="input" placeholder="you@example.com" /></label>
              <label className="block"><span className="label">微信</span><input name="wechat" className="input" placeholder="微信号" /></label>
              <p className="hint">以上三项至少填一项。</p>
              <label className="block">
                <span className="label">打算用来做什么（选填）</span>
                <textarea name="usage" rows={2} maxLength={500} className="input" placeholder="比如：两个人用 Xcode 打包，常开模拟器" />
              </label>
              <FormError message={state?.error} />
              <button className="btn-primary w-full" disabled={pending}>{pending ? "提交中…" : "登记到货通知"}</button>
              <p className="text-center text-xs text-muted">只用于这次到货通知，不会用于营销。</p>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
