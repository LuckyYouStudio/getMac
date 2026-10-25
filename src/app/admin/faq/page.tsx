import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { deleteFaq, saveFaq } from "../actions/content";

export const metadata = { title: "FAQ 管理" };

export default async function FaqAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const faqs = await db.faq.findMany({ orderBy: [{ category: "asc" }, { sort: "asc" }] });
  const editing = edit ? faqs.find((f) => f.id === edit) : undefined;
  const categories = [...new Set(faqs.map((f) => f.category))];

  return (
    <div>
      <PageHeader title="常见问题" desc="前台 /faq 页面与首页摘要使用这里的内容。" />
      <ErrorBanner error={error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card divide-y divide-line">
          {faqs.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{f.category}</Badge>
                  {!f.published && <Badge>未发布</Badge>}
                  <span className="font-medium">{f.question}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{f.answer}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link href={`/admin/faq?edit=${f.id}`} className="btn-ghost btn-sm">编辑</Link>
                <form action={deleteFaq}>
                  <input type="hidden" name="id" value={f.id} />
                  <SubmitButton className="btn-ghost btn-sm text-danger" confirm="删除这条问答？">删除</SubmitButton>
                </form>
              </div>
            </div>
          ))}
          {faqs.length === 0 && <p className="p-6 text-center text-sm text-muted">暂无问答</p>}
        </div>

        <form action={saveFaq} className="card h-fit space-y-3 p-5" key={editing?.id ?? "new"}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? "编辑问答" : "新增问答"}</h2>
            {editing && <Link href="/admin/faq" className="text-xs text-brand">取消</Link>}
          </div>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className="block"><span className="label">问题</span><input name="question" className="input" required defaultValue={editing?.question} /></label>
          <label className="block"><span className="label">回答</span><textarea name="answer" rows={5} className="input" required defaultValue={editing?.answer} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">分类</span>
              <input name="category" list="faq-cats" className="input" defaultValue={editing?.category ?? "自营"} />
              <datalist id="faq-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="block"><span className="label">排序</span><input name="sort" type="number" className="input" defaultValue={editing?.sort ?? faqs.length} /></label>
          </div>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> 发布</label>
          <SubmitButton className="btn-primary w-full">保存</SubmitButton>
        </form>
      </div>
    </div>
  );
}
