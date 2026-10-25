import Link from "next/link";
import { GUIDES } from "./content";

export const metadata = { title: "选购指南" };

export default function GuidesPage() {
  return (
    <div className="container-page py-14">
      <div className="eyebrow">选购指南</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">租之前、出租之前，先读这些。</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">怎么比较远程 Mac、该问房东什么、网络怎么测、出租前要准备什么。每篇几分钟读完。</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card group block p-6 transition hover:border-brand/40">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">{g.audience}</span>
              <span>约 {g.minutes} 分钟</span>
            </div>
            <h2 className="mt-3 font-semibold text-ink group-hover:text-brand">{g.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{g.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
