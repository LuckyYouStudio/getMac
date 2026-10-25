"use client";

import { useEffect, useState } from "react";

function timeIn(tz: string, d: Date) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

function hourIn(tz: string, d: Date) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(d)) % 24;
}

function period(h: number) {
  if (h < 6) return "深夜";
  if (h < 9) return "清晨";
  if (h < 12) return "上午";
  if (h < 14) return "中午";
  if (h < 18) return "下午";
  if (h < 22) return "晚上";
  return "深夜";
}

/** 纽约 / 北京双时钟：机器那边一直醒着 */
export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const nyH = now ? hourIn("America/New_York", now) : 0;
  const bjH = now ? hourIn("Asia/Shanghai", now) : 0;
  const bjAwake = bjH >= 8 && bjH < 23;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-navy px-5 py-3 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          在线 · 24 小时不休眠
        </span>
        <span>uptime 99.9%</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line">
        <div className="p-5">
          <div className="text-xs text-muted">纽约 · 你的 Mac</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-ink">{now ? timeIn("America/New_York", now) : "--:--"}</div>
          <div className="mt-1 text-xs text-muted">{now ? period(nyH) : ""}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-muted">北京 · 你</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-ink">{now ? timeIn("Asia/Shanghai", now) : "--:--"}</div>
          <div className="mt-1 text-xs text-muted">{now ? period(bjH) : ""}</div>
        </div>
      </div>
      <div className="border-t border-line bg-surface-2 px-5 py-3 text-sm text-ink-soft">
        {bjAwake ? "你在开会、吃饭的时候，它在纽约把任务跑完。" : "你睡觉的时候，它替你守着构建和测试。"}
      </div>
    </div>
  );
}
