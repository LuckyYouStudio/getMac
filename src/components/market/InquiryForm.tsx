"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { startInquiryAction } from "@/app/(site)/market/_actions/conversations";
import { SubmitButton } from "@/components/SubmitButton";

const FIELDS = ["purpose", "startMode", "startDate", "term", "question"] as const;

/** 结构化咨询表单。草稿存在本机浏览器，提交成功后清除。 */
export function InquiryForm({ listingId }: { listingId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const key = `gm-inquiry-draft:${listingId}`;

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, string>;
      for (const f of FIELDS) {
        const el = form.elements.namedItem(f);
        if (!el || saved[f] == null) continue;
        if (el instanceof RadioNodeList) el.value = saved[f];
        else (el as HTMLInputElement).value = saved[f];
      }
    } catch {
      // 本地存储不可用时忽略
    }
    const save = () => {
      try {
        const data: Record<string, string> = {};
        for (const f of FIELDS) {
          const el = form.elements.namedItem(f);
          if (el) data[f] = el instanceof RadioNodeList ? el.value : (el as HTMLInputElement).value;
        }
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // 忽略
      }
    };
    form.addEventListener("input", save);
    return () => form.removeEventListener("input", save);
  }, [key]);

  return (
    <form
      ref={ref}
      action={startInquiryAction}
      onSubmit={() => {
        try { localStorage.removeItem(key); } catch { /* 忽略 */ }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="listingId" value={listingId} />
      <label className="block">
        <span className="label">用途 *</span>
        <input name="purpose" required maxLength={60} className="input" placeholder="如：跑 AI 编程任务、iOS 打包上架" />
      </label>
      <fieldset>
        <span className="label">希望什么时候开始 *</span>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5"><input type="radio" name="startMode" value="ASAP" defaultChecked /> 尽快</label>
          <label className="flex items-center gap-1.5"><input type="radio" name="startMode" value="TBD" /> 待定</label>
          <label className="flex items-center gap-1.5"><input type="radio" name="startMode" value="DATE" /> 指定日期</label>
          <input name="startDate" type="date" className="input w-auto py-1" />
        </div>
      </fieldset>
      <label className="block">
        <span className="label">预计租多久 *</span>
        <input name="term" required maxLength={30} className="input" placeholder="如：3 个月、先试 1 个月" />
      </label>
      <label className="block">
        <span className="label">想问房东的问题</span>
        <textarea name="question" rows={4} maxLength={1000} className="input" placeholder="例如：能装 Docker 吗？停电多久恢复？交付用什么方式？" />
      </label>
      <label className="flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-xs leading-5 text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>
          我知道 GetMac 只提供信息展示和站内对话，不核验设备、不经手租金；租用的是整台机器，我会遵守 macOS 许可和
          <Link href="/market/rules" className="text-brand hover:underline" target="_blank">市场规则</Link>。
        </span>
      </label>
      <SubmitButton className="btn-primary w-full" pendingText="发送中…">发送咨询</SubmitButton>
      <p className="text-center text-xs text-muted">咨询不是订单，不会产生任何费用。草稿只保存在你的浏览器里。</p>
    </form>
  );
}
