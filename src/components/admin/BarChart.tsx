/** 极简柱状图（纯 SVG），用于看板的 14 天趋势 */
export function BarChart({
  data,
  color = "var(--color-brand)",
  unit = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 560;
  const H = 160;
  const pad = 22;
  const bw = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img">
      <line x1={pad} x2={W - pad} y1={H} y2={H} stroke="var(--color-line-strong)" />
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * (H - 24));
        const x = pad + i * bw + bw * 0.18;
        const w = bw * 0.64;
        return (
          <g key={d.label}>
            <rect x={x} y={H - h} width={w} height={h} rx={3} fill={color} opacity={i === data.length - 1 ? 1 : 0.75}>
              <title>{`${d.label}：${d.value}${unit}`}</title>
            </rect>
            {d.value > 0 && (
              <text x={x + w / 2} y={H - h - 4} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
                {d.value}
              </text>
            )}
            {(i % 2 === 0 || i === data.length - 1) && (
              <text x={x + w / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
                {d.label.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
