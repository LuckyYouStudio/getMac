import Link from "next/link";
import { reportAction } from "@/app/(site)/market/_actions/reports";
import { SubmitButton } from "@/components/SubmitButton";
import { REPORT_CATEGORIES } from "@/lib/constants";

/** 折叠式举报表单。未登录时提示登录。 */
export function ReportForm({ targetType, targetId, returnTo, loggedIn, label = "举报" }: {
  targetType: "LISTING" | "WANTED" | "POST" | "REPLY" | "MESSAGE" | "USER" | "REVIEW";
  targetId: string;
  returnTo: string;
  loggedIn: boolean;
  label?: string;
}) {
  if (!loggedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="text-xs text-muted hover:text-danger">
        登录后{label}
      </Link>
    );
  }
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer list-none text-xs text-muted hover:text-danger">{label}</summary>
      <form action={reportAction} className="mt-2 space-y-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <select name="category" required defaultValue="" className="input">
          <option value="" disabled>选择举报类型</option>
          {Object.entries(REPORT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <textarea name="reason" required minLength={4} maxLength={500} rows={3} className="input" placeholder="具体说明发生了什么，平台会据此核实" />
        <SubmitButton className="btn-danger btn-sm" pendingText="提交中…">提交举报</SubmitButton>
      </form>
    </details>
  );
}
