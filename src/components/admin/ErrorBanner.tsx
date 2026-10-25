/** 显示通过 ?error= 传回的操作错误 */
export function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="mb-4 rounded-lg border border-danger/25 bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</div>;
}
