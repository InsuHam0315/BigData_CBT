import { useState } from "react";
import type { CaseStudy, Row } from "../types";
import { quantile } from "../engine";
const colors = ["#46d7bc", "#af9cf7", "#f1be68", "#69b8f7"];
const fmt = (n: number) =>
  Number.isInteger(n)
    ? String(n)
    : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
export function DataChart({
  data,
  rows = data.rows,
  percent = false,
}: {
  data: CaseStudy;
  rows?: Row[];
  percent?: boolean;
}) {
  const [hover, setHover] = useState("");
  const c = data.chart;
  if (!c)
    return (
      <p className="muted">
        이 사례는 표·코드로 관찰한다. 분석 목표를 먼저 읽어 보세요.
      </p>
    );
  const W = 680,
    H = 330,
    left = 75,
    right = c.type === "dual" ? 75 : 30,
    top = 45,
    bottom = 65,
    pw = W - left - right,
    ph = H - top - bottom;
  const tooltip = (s: string) => ({
    tabIndex: 0,
    onMouseEnter: () => setHover(s),
    onMouseLeave: () => setHover(""),
    onFocus: () => setHover(s),
    onBlur: () => setHover(""),
  });
  const title = (
    <title>
      {c.title}. {c.xLabel}, {c.yLabel}. 정확한 수치는 대체 데이터 표를
      확인하세요.
    </title>
  );
  if (c.type === "words") {
    const max = Math.max(...rows.map((r) => Number(r[c.y])), 1);
    return (
      <figure className="chart">
        <svg
          role="img"
          aria-label="빈도에 비례한 워드클라우드"
          viewBox={`0 0 ${W} ${H}`}
        >
          {title}
          {rows.map((r, i) => {
            const n = Number(r[c.y]),
              x = 170 + (i % 2) * 330,
              y = 65 + Math.floor(i / 2) * 95;
            return (
              <g
                key={i}
                {...tooltip(
                  `${r[c.x]}: ${n}회 · ${r.keep === "예" ? "불용어 제거 후 유지" : "불용어"}`,
                )}
              >
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  style={{
                    fontSize: 18 + (34 * n) / max,
                    fill: i % 2 === 0 ? "var(--accent)" : "var(--violet)",
                  }}
                >
                  {String(r[c.x])}
                </text>
                <text x={x} y={y + 26} textAnchor="middle">
                  {n}회 · {r.keep === "예" ? "유지" : "불용어"}
                </text>
                <title>
                  {String(r[c.x])}: {n}회
                </title>
              </g>
            );
          })}
        </svg>
        <figcaption>
          {hover ||
            "글자 크기는 등장 빈도에 비례합니다. 의미 중요도·감정은 나타내지 않습니다."}
        </figcaption>
      </figure>
    );
  }
  if (c.type === "network") {
    const ds = [...new Set(rows.map((r) => String(r[c.x])))],
      as = [...new Set(rows.map((r) => String(r[c.y])))];
    const edges = [
      ...new Set(rows.map((r) => String(r[c.x]) + "|" + String(r[c.y]))),
    ];
    const dy = (i: number) => 65 + (i * 200) / Math.max(1, ds.length - 1),
      ay = (i: number) => 65 + (i * 200) / Math.max(1, as.length - 1);
    return (
      <figure className="chart">
        <svg role="img" aria-label={c.title} viewBox={`0 0 ${W} ${H}`}>
          {title}
          <text x={170} y={28} textAnchor="middle">
            감독 (D)
          </text>
          <text x={500} y={28} textAnchor="middle">
            배우 (A)
          </text>
          {edges.map((e) => {
            const [d, a] = e.split("|");
            return (
              <line
                key={e}
                x1={170}
                y1={dy(ds.indexOf(d))}
                x2={500}
                y2={ay(as.indexOf(a))}
                stroke="var(--line-strong)"
                strokeWidth={2}
              />
            );
          })}
          {[
            ...ds.map((n, i) => ({ n, x: 170, y: dy(i), color: colors[1] })),
            ...as.map((n, i) => ({ n, x: 500, y: ay(i), color: colors[0] })),
          ].map((p) => (
            <g
              key={p.n}
              {...tooltip(
                `${p.n}: 고유 이웃 ${edges.filter((e) => e.split("|").includes(p.n)).length}명`,
              )}
            >
              <circle cx={p.x} cy={p.y} r={22} fill={p.color} />
              <text x={p.x} y={p.y + 5} fill="#0c1220" textAnchor="middle">
                {p.n}
              </text>
              <title>{p.n}</title>
            </g>
          ))}
        </svg>
        <figcaption>
          {hover ||
            `협업 레코드 ${rows.length}개 · 고유 엣지 ${edges.length}개 · 역할별 노드 ${ds.length + as.length}개`}
        </figcaption>
      </figure>
    );
  }
  if (c.type === "heatmap") {
    const cols = c.series ?? [c.y],
      cw = pw / cols.length,
      ch = ph / rows.length;
    const vals = rows.flatMap((r) =>
        cols.map((k) => (r[k] === null ? null : Number(r[k]))),
      ),
      max = Math.max(...vals.filter((v): v is number => v !== null), 1);
    return (
      <figure className="chart">
        <svg role="img" aria-label={c.title} viewBox={`0 0 ${W} ${H + 20}`}>
          {title}
          {cols.map((k, i) => (
            <text key={k} x={left + (i + 0.5) * cw} y={30} textAnchor="middle">
              {k}
            </text>
          ))}
          {rows.map((r, i) => (
            <g key={i}>
              <text x={left - 10} y={top + (i + 0.5) * ch + 5} textAnchor="end">
                {r[c.x]}
              </text>
              {cols.map((k, j) => {
                const val = r[k],
                  v = Number(val),
                  light = val === null ? 0 : 0.15 + (0.7 * v) / max;
                return (
                  <g
                    key={k}
                    {...tooltip(
                      `${r[c.x]} × ${k}: ${val === null ? "미관측" : fmt(v)}`,
                    )}
                  >
                    <rect
                      x={left + j * cw + 2}
                      y={top + i * ch + 2}
                      width={cw - 4}
                      height={ch - 4}
                      rx={4}
                      fill={
                        val === null
                          ? "var(--surface)"
                          : `rgba(70,215,188,${light})`
                      }
                      stroke="var(--line)"
                    />
                    <text
                      x={left + (j + 0.5) * cw}
                      y={top + (i + 0.5) * ch + 5}
                      textAnchor="middle"
                      fill={
                        val !== null && v / max > 0.6
                          ? "#081c1a"
                          : "var(--text)"
                      }
                    >
                      {val === null ? "—" : fmt(v)}
                    </text>
                    <title>
                      {r[c.x]} × {k}: {val === null ? "미관측" : v}
                    </title>
                  </g>
                );
              })}
            </g>
          ))}
          <text x={left} y={H - 25}>
            척도: 0 → {fmt(max)} · 숫자로도 표시
          </text>
          <text x={W / 2} y={H} textAnchor="middle">
            {c.xLabel} × {c.yLabel}
          </text>
        </svg>
        <figcaption>
          {hover || "—는 미평가/미관측입니다. 0과 구분하세요."}
        </figcaption>
      </figure>
    );
  }
  if (c.type === "box") {
    const values = rows.map((r) => Number(r[c.y])).sort((a, b) => a - b);
    const q1 = quantile(values, 0.25),
      med = quantile(values, 0.5),
      q3 = quantile(values, 0.75),
      iqr = q3 - q1;
    const inside = values.filter(
      (v) => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr,
    );
    const min = 0,
      max = Math.max(...values) * 1.1;
    const y = (v: number) => top + ph - ((v - min) / (max - min)) * ph;
    return (
      <figure className="chart">
        <svg role="img" aria-label={c.title} viewBox={`0 0 ${W} ${H}`}>
          {title}
          {Array.from({ length: 5 }, (_, i) => {
            const v = (max * i) / 4;
            return (
              <g key={i}>
                <line
                  x1={left}
                  x2={W - right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--line)"
                />
                <text x={left - 10} y={y(v) + 4} textAnchor="end">
                  {fmt(v)}
                </text>
              </g>
            );
          })}
          <line
            x1={W / 2}
            x2={W / 2}
            y1={y(inside[0])}
            y2={y(inside.at(-1)!)}
            stroke={colors[0]}
            strokeWidth={2}
          />
          {[inside[0], inside.at(-1)!].map((v, i) => (
            <line
              key={i}
              x1={W / 2 - 40}
              x2={W / 2 + 40}
              y1={y(v)}
              y2={y(v)}
              stroke={colors[0]}
              strokeWidth={2}
            />
          ))}
          <rect
            x={W / 2 - 70}
            y={y(q3)}
            width={140}
            height={y(q1) - y(q3)}
            fill={colors[0]}
            opacity={0.35}
            stroke={colors[0]}
          />
          <line
            x1={W / 2 - 70}
            x2={W / 2 + 70}
            y1={y(med)}
            y2={y(med)}
            stroke={colors[0]}
            strokeWidth={3}
          />
          {[
            ["Q3", q3],
            ["중앙값", med],
            ["Q1", q1],
          ].map(([k, v]) => (
            <text key={k} x={W / 2 + 90} y={y(Number(v)) + 5}>
              {k} {v}
            </text>
          ))}
          {values
            .filter((v) => !inside.includes(v))
            .map((v, i) => (
              <circle
                key={i}
                cx={W / 2}
                cy={y(v)}
                r={5}
                fill={colors[1]}
                {...tooltip(`극단 관측: ${v}분`)}
              />
            ))}
          <text x={W / 2} y={H - 15} textAnchor="middle">
            {c.xLabel} · IQR {fmt(iqr)}
          </text>
          <text
            transform={`translate(22 ${H / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {c.yLabel}
          </text>
        </svg>
        <figcaption>
          {hover ||
            `선형 보간 · 수염 ${inside[0]}~${inside.at(-1)} · 표본 ${values.length}개`}
        </figcaption>
      </figure>
    );
  }
  const scatter = c.type === "scatter";
  const xvals = rows.map((r) => Number(r[c.x]));
  const xmin = scatter ? Math.min(...xvals) - 1 : 0,
    xmax = scatter ? Math.max(...xvals) + 1 : 1;
  const yvals = rows.map((r) => Number(r[c.y]));
  const total = yvals.reduce((a, b) => a + b, 0);
  const ydata = percent ? yvals.map((v) => (v / total) * 100) : yvals;
  const ymin = scatter ? Math.min(...ydata) - 1 : 0,
    ymax = scatter ? Math.max(...ydata) + 1 : Math.max(...ydata, 1) * 1.15;
  const x = (v: number) => left + ((v - xmin) / (xmax - xmin)) * pw,
    y = (v: number) => top + ph - ((v - ymin) / (ymax - ymin)) * ph;
  const step = pw / rows.length,
    cx = (i: number) => left + step * (i + 0.5);
  const rightVals =
      c.type === "dual" ? rows.map((r) => Number(r[c.series![1]])) : [],
    rmax = Math.max(...rightVals, 1) * 1.15,
    ry = (v: number) => top + ph - (v / rmax) * ph;
  return (
    <figure className="chart">
      <svg role="img" aria-label={c.title} viewBox={`0 0 ${W} ${H}`}>
        {title}
        {Array.from({ length: 5 }, (_, i) => {
          const v = ymin + ((ymax - ymin) * i) / 4;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={W - right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--line)"
              />
              <text x={left - 10} y={y(v) + 4} textAnchor="end">
                {fmt(v)}
              </text>
              {c.type === "dual" && (
                <text x={W - right + 10} y={y(v) + 4}>
                  {fmt((rmax * i) / 4)}
                </text>
              )}
            </g>
          );
        })}
        {scatter
          ? Array.from({ length: 5 }, (_, i) => {
              const v = xmin + ((xmax - xmin) * i) / 4;
              return (
                <text key={i} x={x(v)} y={H - bottom + 23} textAnchor="middle">
                  {fmt(v)}
                </text>
              );
            })
          : rows.map((r, i) => (
              <text
                key={i}
                x={cx(i)}
                y={H - bottom + 23}
                textAnchor="middle"
                fontSize={rows.length > 5 ? 11 : 13}
              >
                {String(r[c.x])}
              </text>
            ))}
        {(c.type === "line" || c.type === "dual") && (
          <polyline
            points={ydata.map((v, i) => `${cx(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={colors[0]}
            strokeWidth={3}
          />
        )}{" "}
        {rows.map((r, i) => {
          const label = `${r[c.x]}: ${fmt(ydata[i])}${percent ? "%" : ""}`,
            pointX = scatter ? x(xvals[i]) : cx(i);
          return (
            <g key={i} {...tooltip(label)}>
              {scatter || c.type === "line" || c.type === "dual" ? (
                <circle
                  cx={pointX}
                  cy={y(ydata[i])}
                  r={6}
                  fill={colors[0]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ) : (
                <rect
                  x={pointX - step * (c.type === "histogram" ? 0.48 : 0.31)}
                  y={y(ydata[i])}
                  width={step * (c.type === "histogram" ? 0.96 : 0.62)}
                  height={H - bottom - y(ydata[i])}
                  rx={c.type === "histogram" ? 0 : 5}
                  fill={colors[i % 2]}
                />
              )}
              <text
                x={pointX}
                y={y(ydata[i]) - 12}
                textAnchor="middle"
                fontSize={12}
              >
                {fmt(ydata[i])}
                {percent ? "%" : ""}
              </text>
              <title>{label}</title>
            </g>
          );
        })}
        {c.type === "dual" && (
          <>
            <polyline
              points={rightVals.map((v, i) => `${cx(i)},${ry(v)}`).join(" ")}
              fill="none"
              stroke={colors[1]}
              strokeDasharray="6 4"
              strokeWidth={3}
            />
            {rightVals.map((v, i) => (
              <g key={i} {...tooltip(`가상 투자: ${v} 십억 달러`)}>
                <rect
                  x={cx(i) - 5}
                  y={ry(v) - 5}
                  width={10}
                  height={10}
                  fill={colors[1]}
                />
                <text x={cx(i) + 15} y={ry(v) + 5} fill={colors[1]}>
                  {v}
                </text>
              </g>
            ))}
            <text
              transform={`translate(${W - 12} ${H / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              {c.rightLabel}
            </text>
          </>
        )}
        <text
          transform={`translate(20 ${H / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {percent ? "구성비 (%)" : c.yLabel}
        </text>
        <text x={W / 2} y={H - 10} textAnchor="middle">
          {c.xLabel}
        </text>
      </svg>
      <figcaption>
        {hover ||
          `${c.title}${percent ? ` · 분모 ${total}` : ""}${c.type === "dual" ? " · ● 실선=등록 (좌), ■ 점선=투자 (우)" : ""}`}
      </figcaption>
    </figure>
  );
}
