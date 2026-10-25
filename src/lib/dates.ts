const DAY = 86400000;

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

/** 按自然月加月份；月末溢出时取目标月最后一天（1 月 31 日 + 1 月 = 2 月 28/29 日） */
export function addMonths(d: Date, n: number) {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(day, last));
  return x;
}

export function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / DAY);
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
