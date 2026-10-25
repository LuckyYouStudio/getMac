/** 读 JSON 字符串字段，坏数据时回退默认值 */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function parseList(raw: string | null | undefined): string[] {
  const v = parseJson<unknown>(raw, []);
  return Array.isArray(v) ? v.map(String) : [];
}
