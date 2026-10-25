import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/constants";

const TONE: Record<Tone, string> = {
  ok: "bg-safe-soft text-safe",
  warn: "bg-warn-soft text-warn",
  info: "bg-brand-soft text-brand",
  danger: "bg-danger-soft text-danger",
  muted: "bg-surface-2 text-muted",
};

export function Badge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {children}
    </span>
  );
}

/** 根据状态映射表渲染徽标 */
export function StatusBadge({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value: string }) {
  const s = map[value] ?? { label: value, tone: "muted" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={className} aria-hidden>
      <path d="M5 12l5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card px-6 py-12 text-center text-sm text-muted">{children}</div>;
}

/** 平台免责提示条（C2C 市场用） */
export function Notice({ tone = "warn", children }: { tone?: "warn" | "ok" | "info"; children: ReactNode }) {
  const cls = {
    warn: "border-warn/25 bg-warn-soft text-warn",
    ok: "border-safe/25 bg-safe-soft text-safe",
    info: "border-brand/20 bg-brand-soft text-brand-dark",
  }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${cls}`}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{message}</p>;
}

export function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? <Link className="btn-outline btn-sm" href={href(page - 1)}>上一页</Link> : <span className="btn-outline btn-sm opacity-40">上一页</span>}
      <span className="text-muted">第 {page} / {totalPages} 页</span>
      {page < totalPages ? <Link className="btn-outline btn-sm" href={href(page + 1)}>下一页</Link> : <span className="btn-outline btn-sm opacity-40">下一页</span>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
