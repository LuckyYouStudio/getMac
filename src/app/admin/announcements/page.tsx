import Link from "next/link";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBanner } from "@/components/admin/ErrorBanner";
import { deleteAnnouncement, saveAnnouncement } from "../actions/content";

export const metadata = { title: "公告管理" };

export default async function AnnouncementsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const items = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });
  const editing = edit ? items.find((a) => a.id === edit) : undefined;

  return (
    <div>
      <PageHeader title="公告" desc="已发布的最新一条会显示在前台顶部。" />
      <ErrorBanner error={error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card divide-y divide-line">
          {items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.title}</span>
                  {a.published ? <Badge tone="ok">已发布</Badge> : <Badge>草稿</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">{a.body}</p>
                <p className="mt-1 text-xs text-muted">{dateTime(a.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link href={`/admin/announcements?edit=${a.id}`} className="btn-ghost btn-sm">编辑</Link>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="btn-ghost btn-sm text-danger" confirm="删除这条公告？">删除</SubmitButton>
                </form>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted">暂无公告</p>}
        </div>

        <form action={saveAnnouncement} className="card h-fit space-y-3 p-5" key={editing?.id ?? "new"}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? "编辑公告" : "新增公告"}</h2>
            {editing && <Link href="/admin/announcements" className="text-xs text-brand">取消</Link>}
          </div>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className="block"><span className="label">标题</span><input name="title" className="input" required defaultValue={editing?.title} /></label>
          <label className="block"><span className="label">内容</span><textarea name="body" rows={4} className="input" defaultValue={editing?.body} /></label>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> 发布</label>
          <SubmitButton className="btn-primary w-full">保存</SubmitButton>
        </form>
      </div>
    </div>
  );
}
