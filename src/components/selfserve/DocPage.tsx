import type { ReactNode } from "react";

/** 指南 / 条款类长文页面的通用外壳，左侧目录 + 右侧正文 */
export function DocPage({
  eyebrow,
  title,
  desc,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc?: ReactNode;
  toc?: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="container-page py-14">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">{title}</h1>
      {desc && <p className="mt-3 max-w-2xl text-ink-soft">{desc}</p>}
      <div className={`mt-10 grid gap-10 ${toc ? "md:grid-cols-[200px_1fr]" : ""}`}>
        {toc && (
          <nav className="hidden md:block">
            <ul className="sticky top-24 space-y-1 text-sm">
              {toc.map((t) => (
                <li key={t.id}><a href={`#${t.id}`} className="block rounded-md px-3 py-1.5 text-ink-soft hover:bg-surface-2 hover:text-brand">{t.label}</a></li>
              ))}
            </ul>
          </nav>
        )}
        <article className="card prose-gm max-w-3xl p-6 md:p-10">{children}</article>
      </div>
    </div>
  );
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-navy p-4 font-mono text-sm leading-6 text-slate-200">{children}</pre>;
}
