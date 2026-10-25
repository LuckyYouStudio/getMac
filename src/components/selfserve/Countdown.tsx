"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** 订单保留倒计时，归零后刷新页面 */
export function Countdown({ until }: { until: string }) {
  const router = useRouter();
  const end = new Date(until).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const l = Math.max(0, end - Date.now());
      setLeft(l);
      if (l === 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end, router]);

  if (left === null) return <span className="font-mono">--:--</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="font-mono">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>;
}
