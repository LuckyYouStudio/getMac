import { requireUser } from "@/lib/auth";
import { COMMUNITY_BOARDS, MARKET_LIMITS } from "@/lib/constants";
import { Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash } from "@/components/market/Flash";
import { createPostAction } from "../../_actions/community";

export const metadata = { title: "发新帖 · 交流区" };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ board?: string; err?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/market/community/new");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="发新帖" desc={`每天最多 ${MARKET_LIMITS.dailyTopics} 个话题，发布后 ${MARKET_LIMITS.postEditMinutes} 分钟内可以编辑。`} />
      <Flash err={sp.err} />
      {user.restricted ? (
        <Notice tone="warn">你的账号目前受限，不能发帖。</Notice>
      ) : (
        <form action={createPostAction} className="card space-y-4 p-6">
          <label className="block">
            <span className="label">版块</span>
            <select name="board" defaultValue={sp.board && sp.board in COMMUNITY_BOARDS ? sp.board : "experience"} className="input">
              {Object.entries(COMMUNITY_BOARDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">标题</span>
            <input name="title" required minLength={4} maxLength={60} className="input" />
          </label>
          <label className="block">
            <span className="label">正文</span>
            <textarea name="body" required minLength={10} maxLength={5000} rows={8} className="input" />
            <span className="hint block">帖子公开可见，不要留微信、电话、邮箱。含链接的帖子需要审核后公开。</span>
          </label>
          <div className="flex justify-end"><SubmitButton pendingText="发布中…">发布</SubmitButton></div>
        </form>
      )}
    </div>
  );
}
