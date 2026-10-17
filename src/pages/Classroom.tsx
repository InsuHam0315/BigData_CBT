import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, ChevronUp, TriangleAlert } from "lucide-react";
import { caseMap, lessons, lessonMap, topics } from "../content";
import type { Lesson } from "../types";
import { useStudy } from "../context";
import { readChapter, readLesson } from "../storage";
import { Heading, BookmarkButton } from "../components/UI";
import { Code, Sources } from "../components/Materials";
import { LessonPrimer, WorkedExamples, LessonLab, LessonSelfChecks, LessonSummary } from "../components/LessonStudy";

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}

function QuickCheck({ lesson }: { lesson: Lesson }) {
  const [open,setOpen] = useState(false);
  return <section id={`${lesson.id}-check`} className="lesson-check"><span className="eyebrow">QUICK CHECK</span><h3>잠깐 확인</h3><p>{lesson.check.question}</p><button aria-expanded={open} aria-controls={`${lesson.id}-answer`} onClick={()=>setOpen(!open)}>{open?'답 접기':'답 확인'}</button>{open&&<p id={`${lesson.id}-answer`} className="explanation">{lesson.check.answer}</p>}</section>;
}

function Practice({ lesson }: { lesson: Lesson }) {
  const [open,setOpen] = useState(false);
  return <details className="chapter-practice" onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary>{lesson.title} · 가상 사례 {lesson.caseIds.length}개와 풀이</summary>
    {open&&<><WorkedExamples lesson={lesson}/><div className="actions">{lesson.caseIds.map(cid=><Link className="button" key={cid} to={`/reading?case=${cid}`}>{cid} · {caseMap[cid].title} · 자료 읽기</Link>)}</div></>}
  </details>;
}

function Unit({ lesson:l }: { lesson: Lesson }) {
  const { profile,session,run }=useStudy();
  const done=profile.progress.some(p=>p.lessonId===l.id&&p.completed);
  return <div className="chapter-unit" id={l.id} data-lesson-id={l.id}>
    <header className="chapter-unit-heading"><span className="eyebrow">{l.id} · 장 안의 단원</span><h2>{l.title}</h2><BookmarkButton targetId={l.id} kind="lesson"/></header>
    <LessonPrimer lesson={l}/>
    <section id={`${l.id}-goals`}><h3>학습목표</h3><ul>{l.objectives.map(g=><li key={g}>{g}</li>)}</ul></section>
    {l.sections.map((s,i)=><section className="lesson-body-section" id={`${l.id}-section-${i}`} key={s.heading}><h3>{s.heading}</h3>{s.body.map((p,j)=><p key={j}>{p}</p>)}</section>)}
    <section id={`${l.id}-terms`} className="lesson-terms"><h3>용어와 비교</h3><div className="table-scroll"><table><caption className="sr-only">{l.title} 용어 비교</caption><thead><tr><th scope="col">용어</th><th scope="col">뜻</th><th scope="col">읽을 때 기준</th></tr></thead><tbody>{l.terms.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div></section>
    <LessonLab lesson={l}/>
    <section id={`${l.id}-code`}><h3>{l.codeKind==='diagram'?'수업 개념 도식':'수업 코드 읽기'}</h3><Code code={l.code} notes={l.codeNotes} label={l.codeKind==='diagram'?'수업 개념 도식':'수업 코드 읽기'}/></section>
    <section id={`${l.id}-read`}><h3>읽는 순서</h3><ol>{l.readOrder.map(r=><li key={r}>{r}</li>)}</ol></section>
    <section id={`${l.id}-mistakes`}><h3>자주 하는 실수 · 시험 포인트</h3><ul className="mistakes">{l.mistakes.map(m=><li key={m}><TriangleAlert size={16}/>{m}</li>)}</ul>{l.verification&&<div className="notice">{l.verification}</div>}</section>
    <QuickCheck lesson={l}/><LessonSelfChecks lesson={l}/><LessonSummary lesson={l}/>
    <Sources refs={l.sources} supplements={l.supplements}/>
    <div className="chapter-unit-progress"><button onClick={()=>void run(readLesson(session.userId,l.id,!done))}><Check size={15}/>{done?'이 단원 읽기 완료 해제':'이 단원 읽기 완료'}</button></div>
  </div>;
}

export function Classroom() {
  const location=useLocation(), token=location.pathname.split('/')[2];
  const legacy=lessonMap[token];
  const topicId=legacy?.topic??(token==='chapter'?location.pathname.split('/')[3]:new URLSearchParams(location.search).get('topic'));
  const topic=topics.find(t=>t.id===topicId), chapterLessons=lessons.filter(l=>l.topic===topicId);
  const { profile,session,run }=useStudy();
  const [query,setQuery]=useState('');
  useEffect(()=>{
    if(!topic)return;
    const target=legacy?.id??new URLSearchParams(location.search).get('at');
    void run(readLesson(session.userId,legacy?.id??chapterLessons[0].id));
    if(target){const frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'start'}));return()=>cancelAnimationFrame(frame);}
  },[location.pathname,location.search,session.userId]);
  if(token&&!topic)return <div className="empty"><h1>강의를 찾을 수 없습니다.</h1><Link to="/lessons">강의실로</Link></div>;
  if(!topic){
    const visible=topics.filter(t=>lessons.filter(l=>l.topic===t.id).some(l=>`${l.title} ${l.tags.join(' ')} ${l.sections.map(s=>s.heading+' '+s.body.join(' ')).join(' ')}`.toLowerCase().includes(query.toLowerCase())));
    return <><Heading eyebrow="CLASSROOM" title="장별 강의실" description="기존 A~H의 8개 주제를 각각 한 페이지에 모았습니다. 본문·용어·코드·자가 점검을 이어서 읽고 가상 사례로 연습하세요."/>
      <label className="chapter-search">강의 내용 검색<input placeholder="예: 프로세스, HDFS, 전처리, MAE" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="chapter-cards">{visible.map(t=>{
        const ls=lessons.filter(l=>l.topic===t.id),done=ls.filter(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed)).length;
        return <article className="panel chapter-card" key={t.id}><span className="eyebrow">CHAPTER {topics.indexOf(t)+1} · {t.id}</span><h2><Link to={`/lessons/chapter/${t.id}`}>{t.title}</Link></h2><p>{t.subtitle}</p><ul>{ls.map(l=><li key={l.id}>{l.title}</li>)}</ul><p className="muted">{done===ls.length?'✓ 읽기 완료':done?`${done}/${ls.length}단원 읽기 완료`:'장 전체를 한 페이지에서 학습'}</p><Link className="button primary" to={`/lessons/chapter/${t.id}`}>{topics.indexOf(t)+1}장 전체 읽기<ArrowRight size={16}/></Link></article>;
      })}</div>{!visible.length&&<p className="empty">검색한 내용이 없습니다.</p>}
    </>;
  }
  const chapterNumber=topics.indexOf(topic)+1;
  const done=chapterLessons.every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed));
  const toc=<>{chapterLessons.map(l=><div className="chapter-toc-group" key={l.id}><button onClick={()=>jump(l.id)}>{l.title}</button>{l.sections.map((s,i)=><button key={s.heading} className="chapter-toc-detail" onClick={()=>jump(`${l.id}-section-${i}`)}>{s.heading}</button>)}{l.microLab&&<button className="chapter-toc-detail" onClick={()=>jump(`${l.id}-lab`)}>코드의 출력 확인</button>}<button className="chapter-toc-detail" onClick={()=>jump(`${l.id}-code`)}>코드·도식</button><button className="chapter-toc-detail" onClick={()=>jump(`${l.id}-self-checks`)}>자가 점검</button></div>)}<button onClick={()=>jump('chapter-practice')}>가상 사례·풀이</button><button onClick={()=>jump('chapter-finish')}>진도·읽기 완료로 이동</button></>;
  return <><div id="chapter-top" className="lesson-top"><Link to="/lessons">← 장별 강의실</Link><Link to={`/practice?topic=${topic.id}`}>이 장 문제 연습 →</Link></div>
    <Heading eyebrow={`CHAPTER ${chapterNumber} · ${topic.id}`} title={`${chapterNumber}장 · ${topic.title}`} description="이 페이지에서 장 전체를 읽을 수 있습니다. 목차에서 원하는 내용으로 이동하고, 본문과 코드·자가 점검을 이어서 확인하세요."/>
    <div className="lesson-layout chapter-layout"><article className="lesson-article chapter-article panel" key={topic.id}>
      <details className="mobile-lesson-toc"><summary>이 장의 목차 · 바로가기</summary><nav aria-label="장 목차">{toc}</nav></details>
      {chapterLessons.map(l=><Unit key={l.id} lesson={l}/>)}
      <section id="chapter-practice"><span className="eyebrow">학습용 가상 자료</span><h2>가상 사례·풀이로 적용 연습</h2><p>기존 표·그래프·코드와 문제 해설을 유지했습니다. 아래 자료는 학습을 위해 만든 가상 사례이며 실제 분석 결과와 구분해 읽으세요.</p>{chapterLessons.map(l=><Practice key={l.id} lesson={l}/>)}</section>
      <div className="actions" id="chapter-finish"><button className="primary" onClick={()=>void run(readChapter(session.userId,topic.id,!done))}><Check size={17}/>{done?'장 전체 읽기 완료 해제':'장 전체 읽기 완료'}</button>{topics[chapterNumber]&&<Link className="button" to={`/lessons/chapter/${topics[chapterNumber].id}`}>다음 장 읽기<ArrowRight size={16}/></Link>}<button onClick={()=>jump('chapter-top')}><ChevronUp size={16}/>맨 위로</button></div>
    </article><aside className="lesson-toc chapter-toc panel"><h2>이 장의 목차</h2><nav aria-label="장 목차">{toc}</nav></aside></div>
  </>;
}
