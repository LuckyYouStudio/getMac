"use client";

import { useEffect, useState } from "react";

const NY = "America/New_York";
const BJ = "Asia/Shanghai";

function minutesIn(tz: string, d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d);
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24;
  const m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function hhmm(tz: string, d: Date) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

/** 按纽约时间描述机器在干什么，按北京时间描述你在干什么 */
function nyScene(min: number) {
  const h = min / 60;
  if (h < 6) return "纽约深夜，它在跑你下午布置的长任务";
  if (h < 9) return "纽约清晨，系统更新和健康检查在这时做";
  if (h < 18) return "纽约白天，有人在本地照看着它";
  if (h < 22) return "纽约傍晚，构建和测试照常进行";
  return "纽约入夜，它不关机、不休眠";
}
function bjScene(min: number) {
  const h = min / 60;
  if (h < 7) return "你在睡觉";
  if (h < 9) return "你在通勤路上";
  if (h < 12) return "你在开会、写需求";
  if (h < 14) return "你在吃午饭";
  if (h < 19) return "你在写代码、看结果";
  if (h < 23) return "你下班了，任务留给它";
  return "你准备睡了";
}

/** 首屏：左右拖动，看纽约的一天 */
export function DayTimeline() {
  const [now, setNow] = useState<Date | null>(null);
  // 相对“此刻”的偏移分钟数，范围覆盖纽约的一整天
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const nowNy = now ? minutesIn(NY, now) : 12 * 60;
  const value = Math.min(1439, Math.max(0, nowNy + offset));
  const at = new Date((now ?? new Date(0)).getTime() + (value - nowNy) * 60000);
  const bjMin = now ? minutesIn(BJ, at) : 0;
  const isNow = offset === 0;
  const pct = (value / 1440) * 100;
  const nowPct = (nowNy / 1440) * 100;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-navy px-5 py-3 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          它一直醒着 · 24 小时不休眠
        </span>
        {!isNow && (
          <button type="button" onClick={() => setOffset(0)} className="rounded border border-white/20 px-2 py-0.5 hover:bg-white/10">回到此刻</button>
        )}
      </div>
      <div className="grid grid-cols-2 divide-x divide-line">
        <div className="p-5">
          <div className="text-xs text-muted">纽约 · 你的 Mac {isNow && <span className="ml-1 rounded bg-safe-soft px-1 text-safe">此刻</span>}</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-ink">{now ? hhmm(NY, at) : "--:--"}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-muted">北京 · 你</div>
          <div className="mt-1 font-mono text-3xl font-semibold text-ink">{now ? hhmm(BJ, at) : "--:--"}</div>
        </div>
      </div>
      <div className="border-t border-line px-5 pt-4 pb-5">
        <div className="relative h-8">
          {/* 昼夜色带：纽约 6–18 点为白天 */}
          <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-[linear-gradient(90deg,#0b2545_0%,#1d4f91_22%,#e6eef9_30%,#e6eef9_70%,#1d4f91_80%,#0b2545_100%)]" />
          <div className="absolute top-1 h-6 w-0.5 bg-safe" style={{ left: `${nowPct}%` }} title="此刻" />
          <div className="pointer-events-none absolute top-0.5 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-white bg-brand shadow" style={{ left: `${pct}%` }} />
          <input
            type="range"
            min={0}
            max={1439}
            step={15}
            value={value}
            aria-label="拖动查看纽约一天中的不同时刻"
            onChange={(e) => setOffset(Number(e.target.value) - nowNy)}
            className="absolute inset-0 h-8 w-full cursor-grab opacity-0 active:cursor-grabbing"
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
          <span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
        <p className="mt-3 text-sm text-ink-soft">{nyScene(value)}；{bjScene(bjMin)}。</p>
        <p className="mt-1 text-center text-xs text-muted">← 左右拖动，看纽约的一天 →</p>
      </div>
    </div>
  );
}
