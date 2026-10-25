"use client";

import { useState } from "react";

/** 一键复制文本（复制微信号等） */
export function CopyButton({
  text,
  label = "复制",
  className = "btn-outline btn-sm",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 旧浏览器回退
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {done ? "已复制 ✓" : label}
    </button>
  );
}
