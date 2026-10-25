import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "../content";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  return { title: g ? g.title : "选购指南", description: g?.summary };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== slug && (x.audience === g.audience || x.audience === "都适用")).slice(0, 3);

  return (
    <div className="container-page py-14">
      <Link href="/guides" className="text-sm text-muted hover:text-brand">← 选购指南</Link>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">{g.audience}</span>
        <span>约 {g.minutes} 分钟</span>
      </div>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-navy">{g.title}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{g.summary}</p>
      <article className="card prose-gm mt-8 max-w-3xl p-6 md:p-10">{g.body}</article>
      {others.length > 0 && (
        <div className="mt-10 max-w-3xl">
          <div className="text-sm font-medium text-ink">接着读</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/guides/${o.slug}`} className="card p-4 text-sm hover:border-brand/40">
                <div className="font-medium text-ink">{o.title}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
