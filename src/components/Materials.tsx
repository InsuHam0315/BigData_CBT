import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CaseStudy, Row, SourceRef } from "../types";
import { sourceMap } from "../content";
import { DataChart } from "./Chart";
import { Expand, Table2, BarChart3, ArrowUpDown, X } from "lucide-react";
export function Sources({
  refs,
  supplements = [],
}: {
  refs: SourceRef[];
  supplements?: SourceRef[];
}) {
  return (
    <div className="sources">
      <strong>범위 근거 · PDF 실제 페이지</strong>
      {refs.map((r) => (
        <p key={r.sourceId + ":" + r.pages.join(",")}>
          {sourceMap[r.sourceId].filename} · p{r.pages[0]}
          {r.pages.length > 1 ? `~${r.pages.at(-1)}` : ""}
        </p>
      ))}
      {supplements.length > 0 && (
        <details>
          <summary>설명 보강 자료</summary>
          {supplements.map((r, i) => (
            <p key={i}>
              {sourceMap[r.sourceId].filename} · p{r.pages[0]}~{r.pages.at(-1)}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Row[];
}) {
  const filterId = useId();
  const [sort, setSort] = useState<{ column: string; dir: 1 | -1 } | null>(
      null,
    ),
    [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const v = rows.filter((r) =>
      Object.values(r).some((x) =>
        String(x ?? "—")
          .toLowerCase()
          .includes(filter.toLowerCase()),
      ),
    );
    if (sort)
      v.sort((a, b) => {
        const av = a[sort.column],
          bv = b[sort.column];
        if (av === null) return 1;
        if (bv === null) return -1;
        return (
          (typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "ko")) * sort.dir
        );
      });
    return v;
  }, [rows, sort, filter]);
  return (
    <div className="datatable">
      <div className="table-tools">
        <label className="sr-only" htmlFor={filterId}>
          표 행 필터
        </label>
        <input
          id={filterId}
          aria-label="표 행 필터"
          placeholder="표 안에서 검색…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="muted">
          {visible.length} / {rows.length}행 · 열 제목으로 정렬
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">사례 데이터. —는 결측입니다.</caption>
          <thead>
            <tr>
              {columns.map((k) => (
                <th
                  key={k}
                  aria-sort={
                    sort?.column === k
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() =>
                      setSort({
                        column: k,
                        dir: sort?.column === k && sort.dir === 1 ? -1 : 1,
                      })
                    }
                  >
                    {k}
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                {columns.map((k) => (
                  <td key={k} className={r[k] === null ? "missing" : ""}>
                    {r[k] === null ? "—" : String(r[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="empty">조건에 맞는 행이 없습니다.</p>}
      </div>
    </div>
  );
}
function Modal({
  children,
  close,
}: {
  children: ReactNode;
  close: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label="자료 확대"
        className="modal wide"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
          if (e.key === "Tab") {
            const nodes = [
              ...root.current!.querySelectorAll<HTMLElement>(
                'button,input,select,[tabindex="0"]',
              ),
            ];
            const first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <button className="close" aria-label="확대 닫기" onClick={close}>
          <X />
        </button>
        {children}
        <button onClick={close}>닫기</button>
      </section>
    </div>
  );
}
export function Code({ code, notes = [], label = "코드 읽기" }: { code: string; notes?: string[]; label?: string }) {
  return (
    <div className="code-block">
      <div className="code-caption">
        {label}
      </div>
      <pre tabIndex={0} aria-label={`${label} 예제`}>
        <code>{code}</code>
      </pre>
      {notes.length > 0 && (
        <ol className="code-notes">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
export function Materials({
  data,
  interactive = false,
}: {
  data: CaseStudy;
  interactive?: boolean;
}) {
  const [view, setView] = useState<"both" | "table" | "chart">("both"),
    [expanded, setExpanded] = useState(false),
    [transform, setTransform] = useState("raw"),
    [percent, setPercent] = useState(false);
  const rows = useMemo<Row[]>(() => {
    if (transform === "fill")
      return data.rows.map((r) => ({
        ...r,
        director: r.director ?? "Unknown",
      }));
    if (transform === "drop")
      return data.rows
        .filter((r) => r.date_added !== null && r.rating !== null)
        .map((r) => ({ ...r, director: r.director ?? "Unknown" }));
    if (transform === "explode")
      return data.rows.flatMap((r) =>
        String(r.listed_in)
          .split(", ")
          .map((genre) => ({ show_id: r.show_id, genre })),
      );
    return data.rows;
  }, [data, transform]);
  const columns = transform === "explode" ? ["show_id", "genre"] : data.columns;
  const content = (
    <>
      <div className="case-label">
        <span className="tag">{data.id}</span>
        <span className="tag synthetic">학습용 가상 데이터</span>
      </div>
      <h2>{data.title}</h2>
      <p>{data.scenario}</p>
      <div className="metadata">
        <span>
          원본 관찰 단위 <b>{data.unit}</b>
        </span>
        <span>
          원본 N <b>{data.validN}</b>
        </span>
        <span>
          현재 <b>{rows.length}행</b>
        </span>
      </div>
      {interactive && ["C18", "C20", "C24"].includes(data.id) && (
        <div className="transform-tools">
          {data.id === "C18" && (
            <label>
              결측 처리{" "}
              <select
                aria-label="결측 처리"
                value={transform}
                onChange={(e) => setTransform(e.target.value)}
              >
                <option value="raw">처리 전</option>
                <option value="fill">감독만 Unknown 대체</option>
                <option value="drop">대체 + 날짜·등급 결측 제거</option>
              </select>
            </label>
          )}
          {data.id === "C20" && (
            <label>
              관찰 단위{" "}
              <select
                aria-label="다중값 변환"
                value={transform}
                onChange={(e) => setTransform(e.target.value)}
              >
                <option value="raw">원본 작품</option>
                <option value="explode">장르 관계 펼치기</option>
              </select>
            </label>
          )}
          {data.id === "C24" && (
            <button aria-pressed={percent} onClick={() => setPercent(!percent)}>
              {percent ? "건수 보기" : "구성비 보기"}
            </button>
          )}
          {transform !== "raw" && (
            <p className="notice">
              실제 표에서 변환한 결과 · {rows.length}행
              {transform === "explode" &&
                ` / 고유 작품 ${new Set(rows.map((r) => r.show_id)).size}개`}
            </p>
          )}
        </div>
      )}
      <div className="actions compact">
        <button
          aria-pressed={view === "table"}
          onClick={() => setView(view === "table" ? "both" : "table")}
        >
          <Table2 size={15} />표
        </button>
        {data.chart && (
          <button
            aria-pressed={view === "chart"}
            onClick={() => setView(view === "chart" ? "both" : "chart")}
          >
            <BarChart3 size={15} />
            그래프
          </button>
        )}
        <button onClick={() => setExpanded(true)}>
          <Expand size={15} />
          확대
        </button>
      </div>
      {view !== "chart" && (
        <DataTable
          key={`${data.id}-${transform}`}
          columns={columns}
          rows={rows}
        />
      )}{" "}
      {view !== "table" && data.chart && (
        <DataChart data={data} rows={rows} percent={percent} />
      )}{" "}
      {data.code && <Code code={data.code} notes={data.codeNotes} />}
      <details>
        <summary>데이터 가정·제외 기준</summary>
        <p>{data.exclusions}</p>
        <ul>
          {data.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
        <p>{data.numericOrigin}</p>
      </details>
    </>
  );
  return (
    <>
      <section className="material panel">{content}</section>
      {expanded && (
        <Modal close={() => setExpanded(false)}>
          <h2>{data.title} · 확대</h2>
          <DataTable columns={columns} rows={rows} />
          {data.chart && (
            <DataChart data={data} rows={rows} percent={percent} />
          )}
        </Modal>
      )}
    </>
  );
}
