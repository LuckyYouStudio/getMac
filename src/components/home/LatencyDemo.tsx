"use client";

import { useEffect, useRef, useState } from "react";

const OPTIONS = [150, 220, 320];

/** 对比：远程回显（每个字等一个往返） vs mosh 式本地预显示 */
export function LatencyDemo() {
  const [latency, setLatency] = useState(220);
  const [typed, setTyped] = useState("");
  const [remote, setRemote] = useState("");
  const [confirmed, setConfirmed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function onChange(v: string) {
    setTyped(v);
    const t = setTimeout(() => {
      setRemote(v);
      setConfirmed(v.length);
    }, latency);
    timers.current.push(t);
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTyped("");
    setRemote("");
    setConfirmed(0);
  }

  const ok = typed.slice(0, Math.min(confirmed, typed.length));
  const pending = typed.slice(ok.length);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-ink">亲手试试：0.2 秒的延迟是什么手感？</div>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { setLatency(o); reset(); }}
              className={`rounded-md px-3 py-1 text-xs font-medium ${latency === o ? "bg-surface text-brand shadow-sm" : "text-muted"}`}
            >
              {o} ms
            </button>
          ))}
        </div>
      </div>
      <input
        className="input mt-4 font-mono"
        placeholder="在这里打字，比较两种连接方式…"
        value={typed}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-navy p-4 font-mono text-sm text-slate-200">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>远程桌面 / 普通 SSH</span><span>+{latency} ms</span>
          </div>
          <div className="min-h-6 break-all">
            <span className="text-emerald-400">dev@chicago</span> ~ % {remote}
            <span className="animate-pulse">▍</span>
          </div>
          <p className="mt-3 font-sans text-xs text-slate-400">每个字都要越过太平洋再回来，才出现在屏幕上。</p>
        </div>
        <div className="rounded-xl bg-navy p-4 font-mono text-sm text-slate-200">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>mosh</span><span>本地先显示</span>
          </div>
          <div className="min-h-6 break-all">
            <span className="text-emerald-400">dev@chicago</span> ~ % {ok}
            <span className="underline decoration-amber-400 decoration-2 underline-offset-4">{pending}</span>
            <span className="animate-pulse">▍</span>
          </div>
          <p className="mt-3 font-sans text-xs text-slate-400">字先在本地出现，带下划线的部分还在路上。</p>
        </div>
      </div>
    </div>
  );
}
