/** 显示 action 重定向带回的 ?ok= / ?err= 提示 */
export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (err) return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>;
  if (ok) return <p className="rounded-lg bg-safe-soft px-3 py-2 text-sm text-safe">{ok}</p>;
  return null;
}
