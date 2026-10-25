import Link from "next/link";

/** 链接式的状态标签页 */
export function Tabs({ tabs, current }: { tabs: { key: string; label: string; href: string; count?: number }[]; current: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${
            current === t.key ? "border-brand font-medium text-brand" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1 text-xs opacity-70">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
