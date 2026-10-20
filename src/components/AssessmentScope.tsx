import {Link} from 'react-router-dom';
import type {AssessmentSection} from '../assessment';
import handouts from '../content/handouts.json';

export function AssessmentScope({section}: {section: AssessmentSection}) {
  return <section className="notice assessment-scope" aria-label="출제 자료">
    <strong>{section === 'cbt' ? 'CBT 출제 자료 · 빅데이터1-3장.pdf' : '모의고사 출제 자료 · 필기본 PDF 4개 전체'}</strong>
    {section === 'cbt' ? <p>19쪽의 1~3장 전체에서 출제합니다. 5회 × 40문항을 시간 제한 없이 풀고 문항별로 답안을 확인합니다.</p> : <>
      <ul>{handouts.map(d => <li key={d.id}>{d.filename}</li>)}</ul>
      <p>4개 자료의 전체 내용을 매 회차에 섞었습니다. 5회 × 40문항, 교수님 강조 개념은 매회 25문항입니다. 전체 제출 후 해설을 확인합니다.</p>
    </>}
    <Link to={section === 'cbt' ? '/mock' : '/cbt'}>{section === 'cbt' ? '다른 자료로 공부하기 · 필기본 4개 모의고사 →' : '다른 자료로 공부하기 · 빅데이터1-3장.pdf CBT →'}</Link>
  </section>;
}
