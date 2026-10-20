import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Timer } from 'lucide-react';
import { finalLessons, finalTopics, finalBlueprints, finalQuestions,courseLessonDocument } from '../content';
import { useStudy } from '../context';
import { newDraft, roundQuestions } from '../engine';
import { readLesson, updateProfile } from '../storage';
import { BookmarkButton, Heading } from '../components/UI';
import { Code, SourceLine } from '../components/Materials';
import { Classroom } from './Classroom';
import { QuizStart } from './QuizStart';
import { HandoutHomeLink, RelatedHandouts } from './Handouts';
import { ChapterSummary } from '../components/ChapterSummary';
import chapterSummaries from '../content/final/chapter-summaries.json';

const codeExamples: Record<string, { page: number; code: string; note: string }> = {
  'FN3-2': {page:15, code:`from pathlib import Path
import pandas as pd
raw = Path("data/raw/netflix_titles.csv")
df = pd.read_csv(raw, dtype={"show_id": "string"})
print(df.shape)  # (7787, 12)
print(df.head(3)[["show_id", "type", "title", "duration"]])
print(df["show_id"].isna().sum())
print(df["show_id"].duplicated().sum())
missing = pd.DataFrame({
    "missing_n": df.isna().sum(),
    "missing_pct": (df.isna().mean() * 100).round(1),
}).sort_values("missing_n", ascending=False)`, note:'PDF 코드 발췌. shape는 행·열, sum은 결측 수, mean×100은 결측 비율이다. 같은 이름의 다른 파일은 결과가 다를 수 있다.'},
  'FN3-3': {page:16, code:`from netflix_pipeline import prepare, normalize_multi_values
clean = prepare(df)
genres = normalize_multi_values(clean, "listed_in")
print(clean[["type", "duration", "duration_value", "duration_unit"]].head(3))
print(len(genres), genres["show_id"].nunique())`, note:'PDF 코드 발췌. 수업 제공 netflix_pipeline.py가 필요한 예시다. 이 페이지에서 실행하는 실습이 아니다. 기대 관계/작품 수는 17071/7787이다.'},
  'FN3-4': {page:16, code:`type_n = clean["type"].value_counts()
type_pct = (type_n / len(clean) * 100).round(1)
print(pd.DataFrame({"건수": type_n, "전체 대비 %": type_pct}))
movies = clean.loc[
    clean["type"].eq("Movie") & clean["duration_unit"].eq("min"),
    "duration_value",
].dropna().astype(float)
print(movies.agg(["count", "mean", "median", "min", "max"]))
print(movies.quantile([0.25, 0.75]))
movies.plot.hist(bins=30, title="영화 상영시간 분포")`, note:'PDF p16–17의 코드 발췌를 한 블록으로 모았다. 유형 비율의 분모는 전체 clean, 영화 길이 통계의 대상은 Movie·min·비결측이다.'},
  'FN3-5': {page:17, code:`genre_rating = genres.merge(clean[["show_id", "rating"]], on="show_id", how="left")
table = pd.crosstab(
    genre_rating["value"], genre_rating["rating"].fillna("Missing")
)
top = table.loc[table.sum(axis=1).nlargest(5).index]
row_pct = top.div(top.sum(axis=1), axis=0).mul(100).round(1)`, note:'PDF 코드 발췌. 먼저 장르 관계 수 상위 5개를 고른다. 행 합으로 나누면 장르 안의 등급 구성비다. Missing을 실제 관람 등급으로 읽지 않는다.'},
  'FN3-6': {page:18, code:`annual = (
    clean.dropna(subset=["added_year"])
    .groupby("added_year")
    .size()
    .rename("카탈로그에 남아 있는 등록 건수")
)
print(annual.loc[2017:2021])
annual.plot.line(marker="o", title="현재 스냅샷의 등록 연도별 작품 수")`, note:'PDF 코드 발췌. 등록 연도 결측을 뺀 뒤 작품 행을 센다. 과거에 삭제된 작품과 2021년 부분 관측의 한계를 함께 읽는다.'},
};

function ScopeFacts() {
  return <div className="scope-facts"><span>최종 범위 PDF · 19쪽</span><span>1~3장 필기노트</span><span>5회 × 40문항</span><span>4지선다</span></div>;
}

export function FinalHome() {
  const {profile, session}=useStudy();
  const done=finalLessons.filter(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed)).length;
  const next=finalLessons.find(l=>!profile.progress.some(p=>p.lessonId===l.id&&p.completed))??finalLessons[0];
  return <>
    <section className="hero glass final-hero"><div className="hero-copy"><span className="eyebrow">FINAL SCOPE · 2026.10.19 반영</span><h1>이제, 시험 범위에<br/><em>집중해서 공부하기.</em></h1><p>교수님이 지정한 최종 범위 PDF의 1~3장.<br/>장별 필기노트를 읽고 40문항 모의고사로 확인하세요.</p><ScopeFacts/><div className="actions"><Link className="button primary" to={`/lessons/${next.id}`}><BookOpen size={17}/>필기노트 이어 읽기</Link><Link className="button" to="/mock"><Timer size={17}/>모의고사 1~5회</Link></div></div><div className="final-blueprint"><span className="eyebrow">회차마다 같은 출제 구성</span><strong>40<small>문항</small></strong><div className="difficulty-bar" aria-label="중하 80%, 중 15%, 상 5%"><span/><span/><span/></div><p>중하 32 · 중 6 · 상 2</p><p>정답 1~4번 각각 10문항</p><small>선지를 섞어도 분포 유지</small></div></section>
    {profile.draft&&<div className="notice">{session.displayName}님, 진행 중인 {profile.draft.title}가 있어요. <Link to="/quiz">이어서 풀기 →</Link></div>}
    <section className="stat-grid">{[['읽은 필기노트',`${done} / 3장`],['준비된 예상문제','200문항'],['모의고사','5회차'],['복습할 오답',`${profile.wrongNotes.filter(w=>!w.resolved).length}문항`]].map(([k,v])=><div className="stat-card glass" key={k}><span>{k}</span><strong>{v}</strong></div>)}</section>
    <HandoutHomeLink/>
    <FinalChapterCards/>
    <section className="panel final-notice"><h2>이번 학습의 기준</h2><p>필기노트와 새 모의고사는 빅데이터1-3장.pdf를 기준으로 작성했습니다. 문제는 실제 시험 원문이 아닌 직접 작성한 예상문제입니다. 난이도 비율은 요청한 출제 목표이며 실제 정답률 측정값은 아닙니다.</p><p>기존 넷플릭스 심화·추천·회귀 등은 이전 자료 보관함에서 볼 수 있습니다. 기존 진도·응시·오답·계정 기록도 계속 사용할 수 있습니다.</p><div className="actions"><Link className="button" to="/guide">범위와 공부 방법</Link><Link className="button" to="/lessons?archive=1">이전 강의 보관함</Link><Link className="button" to="/account?view=backup">기록 백업</Link></div></section>
  </>;
}

function FinalChapterCards() {
  const {profile}=useStudy();
  return <section><div className="section-title"><h2>PDF 기반 강의 필기노트</h2><span>한 장 전체를 한 페이지에서</span></div><div className="final-chapter-grid">{finalLessons.map((l,i)=><Link key={l.id} className="chapter-card panel" to={`/lessons/${l.id}`}><span className="eyebrow">CHAPTER {i+1} · PDF p{l.sources[0].pages[0]}–{l.sources[0].pages.at(-1)}</span><h2>{l.title}</h2><p>{l.intro}</p><small>{profile.progress.some(p=>p.lessonId===l.id&&p.completed)?'✓ 읽기 완료':`${l.sections.length}개 단원 · 전체 펼쳐 읽기`}</small><ArrowRight size={18}/></Link>)}</div></section>;
}

export function LessonEntry() {
  const location=useLocation();
  const document=courseLessonDocument[location.pathname.split('/').at(-1)??''];
  if(document)return <Navigate replace to={`/notebook/${document}`}/>;
  const params = new URLSearchParams(location.search);
  const finalChapter = /^\/lessons\/chapter\/F[123]$/.test(location.pathname);
  const legacy = !finalChapter && (/^\/lessons\/(?:chapter\/)?[A-H](?:\d+)?$/.test(location.pathname) || params.has('archive') || params.has('topic') && !finalTopics.some(t=>t.id===params.get('topic')));
  return legacy?<><div className="notice archive-notice">이전 자료 보관함 · 이전 설명 형식입니다. 최신 전체 필기와 함께 읽으세요. <Link to="/lessons">전체 PDF 핵심노트 →</Link></div><Classroom/></>:<FinalNotes/>;
}

export function FinalNotes() {
  const location=useLocation();
  const id=location.pathname.split('/').at(-1);
  const topic=new URLSearchParams(location.search).get('topic');
  const l=finalLessons.find(l=>l.id===id||l.topic===id||l.topic===topic);
  const {profile,session,run}=useStudy();
  useEffect(()=>{if(l)void run(readLesson(session.userId,l.id));},[l?.id,session.userId]);
  if(!l)return <><Heading eyebrow="PDF STUDY NOTES" title="19쪽 보충 강의 1~3장" description="PDF의 구성·표·계산·코드를 따라 정리했습니다. 장마다 한 페이지에서 전체 내용을 읽을 수 있습니다."/><ScopeFacts/><FinalChapterCards/><HandoutHomeLink/></>;
  const done=profile.progress.some(p=>p.lessonId===l.id&&p.completed);
  return <><Link className="back-link" to="/lessons">← 19쪽 보충 강의</Link><Heading eyebrow="SUPPLEMENT · 19쪽 PDF 강의" title={l.title} description={l.intro}/><div className="actions"><BookmarkButton targetId={l.id} kind="lesson"/><Link className="button" to={`/practice?topic=${l.topic}`}>이 장 문제 연습 →</Link></div><div className="final-note-layout"><article className="panel final-note"><div className="notice">PDF 기반 정리 · 원자료의 내용과 수치를 글로 풀었습니다. PDF에 있는 학습용 가정은 실측과 구분해 표시했습니다.</div>{l.sections.map((s,i)=><section className="final-note-section" id={`${l.id}-${i}`} key={s.heading}><h2>{s.heading}</h2><SourceLine source={s.source}/>{s.body.map(p=><p key={p}>{p}</p>)}{codeExamples[`${l.id}-${i}`]&&<details className="final-code"><summary>PDF 코드 읽기 · p{codeExamples[`${l.id}-${i}`].page}</summary><Code code={codeExamples[`${l.id}-${i}`].code}/><p>{codeExamples[`${l.id}-${i}`].note}</p></details>}</section>)}<ChapterSummary id={`${l.id}-summary`} items={(chapterSummaries[l.id as keyof typeof chapterSummaries]??[]).map(([term,meaning])=>({term,meaning}))}/><RelatedHandouts lessonId={l.id}/><p><Link className="button" to="/notebook">PDF 4개 · 필기용 핵심노트와 장별 Summary →</Link></p><details className="final-added"><summary>추가 해설 · 혼동을 줄이는 복습 방법</summary><p>사이트에서 덧붙인 학습 방법입니다. 용어를 외운 뒤에는 “무엇을 한 건으로 세는가, 분모는 무엇인가, 관측한 사실에서 어디까지 말할 수 있는가”를 스스로 설명해 보세요. 모의고사의 새 수치·상황은 학습용 가정이며 PDF의 실제 고정본 수치와 구분합니다.</p></details><div className="actions"><button className="primary" onClick={()=>void run(readLesson(session.userId,l.id,!done))}><Check size={16}/>{done?'이 장 읽기 완료 해제':'이 장 읽기 완료'}</button><Link className="button" to={`/practice?topic=${l.topic}`}>이 장 문제 연습</Link><Link className="button" to="/mock">모의고사 선택</Link></div></article><aside className="panel final-toc" aria-label="이 장의 목차"><h2>이 장의 목차</h2>{l.sections.map((s,i)=><button key={i} onClick={()=>document.getElementById(`${l.id}-${i}`)?.scrollIntoView({behavior:'smooth',block:'start'})}>{s.heading}</button>)}<button onClick={()=>document.getElementById(`${l.id}-summary`)?.scrollIntoView({behavior:"smooth",block:"start"})}>Summary · 핵심 필기</button><Link className="button" to="/notebook">PDF 전체 핵심노트 →</Link></aside></div></>;
}

export function FinalGuide() {
 return <><Heading eyebrow="EXAM SCOPE" title="이전 19쪽 자료 기준 안내" description="2026년 10월 19일의 이전 구성입니다. 현재 종합 CBT는 PDF 4개 전체를 사용합니다."/><ScopeFacts/><section className="panel final-note"><h2>공부 순서</h2><ol><li>1~3장 필기노트를 읽고 용어·단위·분모를 구분합니다.</li><li>연습 모드에서 답안 확인으로 해설과 근거 쪽수를 읽습니다.</li><li>시험 모드에서 40문항 전체를 푼 뒤 결과·오답을 복습합니다.</li></ol><h2>모의고사 구성</h2><p>5회차, 회차마다 서로 다른 40문항이며 총 200문항입니다. 모두 4지선다입니다. 회차마다 중하 32·중 6·상 2문항, 정답 위치 1~4번 각각 10개입니다. 선지 섞기를 켜도 균형을 유지하며 저장된 순서는 재접속해도 유지됩니다.</p><p>상은 여러 조건을 결합한 판단, 중은 계산·코드·상황 적용, 중하는 정의·기본 구분 중심으로 작성했습니다. 이 구분은 출제 목표이며 실제 응시자 정답률을 보증하지 않습니다. 정답만 길거나 상세해지는 편향을 줄이도록 표현과 길이를 점검했습니다.</p><p>기본 60분은 연습을 위한 설정입니다. 교수님이 지정한 실제 시험 시간은 제공되지 않아 1~240분으로 조절할 수 있습니다.</p><h2>자료 구분</h2><p>기준 자료는 빅데이터1-3장.pdf 19쪽입니다. HDFS 설치·명령, Titanic 분석, 기존 추천·회귀 등 심화 자료는 이번 5회차에 포함하지 않았습니다. PDF의 학습용 가정과 고정본 수치는 노트·해설에 표시했습니다. 추가 설명은 별도 영역으로 구분합니다.</p><p>계정과 학습 기록은 현재 브라우저에 저장됩니다. 기기를 바꾸려면 계정·백업 메뉴에서 백업·복원을 사용하세요.</p><div className="actions"><Link className="button primary" to="/lessons">필기노트</Link><Link className="button" to="/mock">모의고사</Link><Link className="button" to="/handouts">수업 필기자료</Link><Link className="button" to="/lessons?archive=1">이전 자료</Link></div></section></>;
}

export function FinalStart({mock=false}:{mock?:boolean}) {
 const {roundId}=useParams();
 const {profile,session,run,setError}=useStudy();
 const navigate=useNavigate();
 const round=finalBlueprints.find(r=>r.id===roundId);
 const [minutes,setMinutes]=useState(60),[mix,setMix]=useState(profile.settings.shuffle),[starting,setStarting]=useState(false);
 if(roundId&&!round)return <><div className="notice archive-notice">이전 회차 보관함 · 이번 최종 범위 모의고사는 <Link to={mock?'/mock':'/cbt'}>여기에서 선택</Link>하세요.</div><QuizStart mock={mock}/></>;
 const base=mock?'/mock':'/cbt';
 const start=async()=>{
  if(!round||starting)return;
  if(!Number.isInteger(minutes)||minutes<1||minutes>240){setError('시험 시간은 1~240분의 정수로 입력하세요.');return;}
  setStarting(true);
  try{const draft=newDraft(session.userId,mock?'exam':'practice',`${round.title} · ${mock?'시험':'연습'}`,roundQuestions(round),minutes,mix);const saved=await run(updateProfile(session.userId,p=>{p.draft=draft;p.settings.shuffle=mix;}));if(saved)navigate('/quiz');}finally{setStarting(false);}
 };
 return <><Heading eyebrow={mock?'MOCK EXAM':'PRACTICE'} title={round?.title??`최종 범위 ${mock?'모의고사':'문제 연습'} 1~5회`} description={mock?'40문항을 모두 제출한 뒤 해설을 확인합니다.':'같은 5회차를 시간 제한 없이 풀고 문항마다 해설을 확인합니다.'}/><ScopeFacts/>{profile.draft&&<div className="notice">진행 중인 {profile.draft.title}가 있습니다. 새로 시작하면 진행 중 풀이를 교체합니다. <Link to="/quiz">이어서 풀기 →</Link></div>}{!round?<div className="final-round-grid">{finalBlueprints.map((r,i)=><article className="panel" key={r.id}><span className="eyebrow">ROUND {i+1}</span><h2>{r.title}</h2><p>40문항 · 1~3장 종합</p><p className="muted">중하 32 · 중 6 · 상 2<br/>정답 1~4번 각각 10개</p><Link className="button primary" to={`${base}/${r.id}`}>회차 선택<ArrowRight size={16}/></Link></article>)}</div>:<section className="panel setup"><h2>응시 설정 · 40문항</h2><p>PDF 1~3장만으로 작성한 예상문제입니다. 회차 간 문항 ID·질문이 겹치지 않으며 개념은 반복 복습합니다.</p><div className="scope-chapter-counts">{finalTopics.map(t=><span className="tag" key={t.id}>{t.title.split(' · ')[0]} {round.questionIds!.filter(id=>finalQuestions.find(q=>q.id===id)?.topic===t.id).length}문항</span>)}</div>{mock&&<label>연습용 제한 시간 (분)<input type="number" min={1} max={240} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/><small>기본 60분 · 실제 시험 시간 미제공</small></label>}<label className="check-row"><input type="checkbox" checked={mix} onChange={e=>setMix(e.target.checked)}/>선지 순서 섞기 · 정답 위치는 각 10개 유지</label><p className="muted">난이도: 상 2(5%) · 중 6(15%) · 중하 32(80%). 재접속해도 답안·문제 순서·선지 순서가 유지됩니다.</p><div className="actions"><button className="primary" disabled={starting} onClick={()=>void start()}>{starting?'준비 중…':`${mock?'시험':'연습'} 시작`}<ArrowRight size={16}/></button><Link className="button" to={base}>다른 회차</Link><Link className="button" to="/lessons">필기노트</Link></div></section>}</>;
}
