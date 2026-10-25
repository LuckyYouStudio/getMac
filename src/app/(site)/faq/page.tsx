import Link from "next/link";
import { db } from "@/lib/db";
import { FAQ_CATEGORIES, SITE } from "@/lib/constants";

export const metadata = { title: "常见问题" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { published: true }, orderBy: { sort: "asc" } });
  // 按 FAQ_CATEGORIES 的顺序分组；未知分类放到最后
  const known = new Set(FAQ_CATEGORIES.map((c) => c.key));
  const groups = [
    ...FAQ_CATEGORIES.map((c) => ({ ...c, list: faqs.filter((f) => f.category === c.key) })),
    { key: "other", label: "其他", list: faqs.filter((f) => !known.has(f.category)) },
  ].filter((g) => g.list.length > 0);

  return (
    <div className="container-page py-14">
      <div className="eyebrow">常见问题</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">开通之前，你可能想知道。</h1>
      <nav className="mt-6 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.key} href={`#${g.key}`} className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink-soft hover:border-brand hover:text-brand">
            {g.label} <span className="text-muted">{g.list.length}</span>
          </a>
        ))}
      </nav>
      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.key} id={g.key} className="scroll-mt-24">
            <h2 className="mb-3 text-lg font-semibold text-ink">{g.label}</h2>
            <div className="card divide-y divide-line">
              {g.list.map((f) => (
                <details key={f.id} id={`q-${f.id}`} className="group scroll-mt-24 px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                    {f.question}<span className="text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 whitespace-pre-line text-ink-soft">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted">
        没找到答案？<Link className="text-brand hover:underline" href="/apply">给我们留言</Link>，或发邮件到{" "}
        <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>，也可以去{" "}
        <Link className="text-brand hover:underline" href="/market/community">交流区</Link> 问问其他用户。
      </p>
    </div>
  );
}
