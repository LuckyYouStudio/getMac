import Link from "next/link";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export const metadata = { title: "常见问题" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { published: true }, orderBy: [{ category: "asc" }, { sort: "asc" }] });
  const groups = new Map<string, typeof faqs>();
  for (const f of faqs) groups.set(f.category, [...(groups.get(f.category) ?? []), f]);

  return (
    <div className="container-page py-14">
      <div className="eyebrow">常见问题</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">开通之前，你可能想知道。</h1>
      <div className="mt-10 space-y-10">
        {[...groups.entries()].map(([cat, list]) => (
          <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold text-ink">{cat === "自营" ? "自营远程 Mac" : cat === "市场" ? "租赁市场（第三方房东）" : cat}</h2>
            <div className="card divide-y divide-line">
              {list.map((f) => (
                <details key={f.id} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
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
        没找到答案？发邮件到 <a className="text-brand hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>，或去 <Link className="text-brand hover:underline" href="/market/community">交流区</Link> 提问。
      </p>
    </div>
  );
}
