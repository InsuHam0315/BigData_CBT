import {Link, Navigate, useLocation, useParams} from 'react-router-dom';
import {assessmentEntryPath, roundSection, type AssessmentSection} from '../assessment';
import {blueprints} from '../content';
import {FinalStart} from './FinalStudy';
import {CourseStart} from './CourseStudy';
import {QuizStart} from './QuizStart';

export function AssessmentEntry({section}: {section: AssessmentSection}) {
  const {roundId} = useParams();
  const {pathname, search} = useLocation();
  const target = assessmentEntryPath(section, roundId, search);
  if (pathname !== target || new URLSearchParams(search).has('scope')) return <Navigate replace to={target}/>;
  if (!roundId || roundSection(roundId)) return section === 'cbt' ? <FinalStart/> : <CourseStart/>;
  if (blueprints.some(round => round.id === roundId)) return <>
    <div className="notice archive-notice">이전 회차 보관함 · 이전 자료의 문제입니다. <Link to="/cbt">1~3장 CBT</Link> · <Link to="/mock">필기본 4개 모의고사</Link></div>
    <QuizStart mock={section === 'mock'}/>
  </>;
  return <div className="empty"><h1>회차를 찾을 수 없습니다.</h1><Link to={`/${section}`}>회차 목록으로</Link></div>;
}
