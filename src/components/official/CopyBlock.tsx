"use client";

import { useState } from "react";

/** 带“复制”按钮的代码块 */
export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-navy">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-slate-400">
        <span>{label ?? "终端"}</span>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-slate-200 hover:bg-white/10"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // 剪贴板不可用时什么也不做
            }
          }}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 text-slate-100">{code}</pre>
    </div>
  );
}
