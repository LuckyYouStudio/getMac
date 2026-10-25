import { reportAction } from "@/app/(site)/market/actions";
import { SubmitButton } from "@/components/SubmitButton";

/** 折叠式举报表单，提交后回到 returnTo 并带上 ?report=ok */
export function ReportForm({ targetType, targetId, returnTo, label = "举报" }: {
  targetType: "LISTING" | "WANTED" | "POST" | "USER";
  targetId: string;
  returnTo: string;
  label?: string;
}) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer list-none text-xs text-muted hover:text-danger">{label}</summary>
      <form action={reportAction} className="mt-2 space-y-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <textarea name="reason" required minLength={4} maxLength={500} rows={3} className="input" placeholder="请说明原因，例如：信息不实、要求大额预付、站外引流…" />
        <SubmitButton className="btn-danger btn-sm" pendingText="提交中…">提交举报</SubmitButton>
      </form>
    </details>
  );
}

export function ReportResult({ value }: { value?: string }) {
  if (value === "ok") return <p className="rounded-lg bg-safe-soft px-3 py-2 text-sm text-safe">举报已提交，平台会尽快核实处理。</p>;
  if (value === "invalid") return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">举报原因至少 4 个字。</p>;
  return null;
}
