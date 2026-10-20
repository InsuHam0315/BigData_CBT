import type {Question} from '../types';

/** Keep the question's givens available both during solving and later review. */
export function QuestionExhibit({q}: {q: Question}) {
  if (!q.exhibit) return null;
  const {code, columns, rows} = q.exhibit;
  return <div className="question-exhibit">
    {code && <pre>{code}</pre>}
    {columns.length > 0 && <div className="table-scroll"><table>
      <caption>문항에서 제공한 자료</caption>
      <thead><tr>{columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table></div>}
  </div>;
}
