import './ChapterSummary.css';

export type SummaryPoint = { term: string; meaning: string; highlightIds?: string[] };

export function TeacherBadge() {
  return <span className="teacher-badge"><span aria-hidden="true">★</span> 교수님 강조</span>;
}

export function ChapterSummary({items, title='Summary · 핵심 필기', id}: {items: SummaryPoint[]; title?: string; id?: string}) {
  return <section className="chapter-summary" id={id} aria-label={title}>
    <div className="summary-heading"><span className="eyebrow">WRITE & RECALL</span><h3>{title}</h3></div>
    <dl>{items.map((item,i)=><div key={item.term+i} className={item.highlightIds?.length?'summary-point teacher-point':'summary-point'}>
      <dt>{item.term}<span aria-hidden="true">: </span></dt><dd>{item.meaning}{!!item.highlightIds?.length&&<TeacherBadge/>}</dd>
    </div>)}</dl>
  </section>;
}
