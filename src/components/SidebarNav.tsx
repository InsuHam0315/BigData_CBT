import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound, ClipboardList, FlaskConical, FileText, House, Layers, Target, Timer } from "lucide-react";
import { blueprints, lessons, topics, finalBlueprints, finalLessons,courseBlueprints } from "../content";
import { useStudy } from "../context";
import handouts from "../content/handouts.json";
import figures from '../content/source-figures.json';

type Item = { label: string; to: string; completed?: boolean };
function current(to: string, path: string, search: string) {
  const [target, query = ""] = to.split("?");
  if (target.startsWith('/handouts/')) return target === path;
  if(target.startsWith('/lessons/chapter/')){
    const legacy=lessons.find(l=>path===`/lessons/${l.id}`);
    const topic=legacy?.topic??(path==='/lessons'?new URLSearchParams(search).get('topic'):null);
    return target===(topic?`/lessons/chapter/${topic}`:path);
  }
  if (target !== path) return false;
  const actual = new URLSearchParams(search), expected = new URLSearchParams(query);
  return [...actual].every(([k, v]) => expected.get(k) === v) && [...expected].every(([k, v]) => actual.get(k) === v);
}

export function SidebarNav() {
  const location = useLocation();
  const { profile } = useStudy();
  const groups = [
    { id: "home", label: "홈", path: "/", Icon: House, items: [{label: "학습 대시보드", to: "/"}, {label: "학습 순서·시험 범위", to: "/guide"}] },
    { id: "lessons", label: "보충 강의 · 19쪽", path: "/lessons", Icon: BookOpen, items: [{label: "19쪽 보충 강의 전체", to: "/lessons"}, ...finalLessons.map(l=>({label:l.title,to:`/lessons/${l.id}`,completed:profile.progress.some(p=>p.lessonId===l.id&&p.completed)}))] },
    { id: "notebook", label: "필기용 핵심노트", path: "/notebook", Icon: BookOpen, items: [{label: "PDF 전체 필기", to: "/notebook"}, ...handouts.map(d=>({label:`${d.number}. ${d.title}`,to:`/notebook/${d.id}`})), {label:"모든 장 Summary",to:"/notebook?view=summary"}] },
    { id: "figures", label: "원본 차트 읽기", path: "/figures", Icon: ChartNoAxesCombined, items: [{label:"원본 차트·그림 25개",to:"/figures"},...figures.map(f=>({label:f.title,to:`/figures/${f.id}`}))] },
    { id: "handouts", label: "수업 필기자료", path: "/handouts", Icon: FileText, items: [{label: "필기본 4개 전체", to: "/handouts"}, ...handouts.map(d=>({label:`${d.number}. ${d.title} · ${d.pages}쪽`,to:`/handouts/${d.id}`}))] },
    { id: "cbt", label: "종합 CBT · PDF 4개", path: "/cbt", Icon: FlaskConical, items: [{label: "종합 연습 1~5회차", to: "/cbt"}, ...courseBlueprints.map(b=>({label:b.title,to:`/cbt/${b.id}`}))] },
    { id: "mock", label: "종합 모의고사 40문항", path: "/mock", Icon: Timer, items: [{label: "모의고사 1~5회차", to: "/mock"}, ...courseBlueprints.map(b=>({label:b.title,to:`/mock/${b.id}`}))] },
    { id: "wrong", label: "오답노트", path: "/wrong", Icon: ClipboardList, items: [{label: "복습할 오답", to: "/wrong"}, {label: "모든 오답", to: "/wrong?view=all"}, {label: "해결한 오답", to: "/wrong?view=resolved"}, {label: "반복해서 틀린 문제", to: "/wrong?view=repeat"}, {label: "오답 다시 풀기", to: "/practice?wrong=1"}] },
    { id: "records", label: "학습기록", path: "/records", Icon: Layers, items: [{label: "기록 개요", to: "/records"}, {label: "강의별 진도", to: "/records?view=progress"}, {label: "응시 이력·점수", to: "/records?view=attempts"}, {label: "취약점 분석", to: "/records?view=weakness"}, {label: "내 북마크", to: "/records?view=bookmarks"}] },
    { id: "review", label: "시험 범위·학습 안내", path: "/review", Icon: Target, items: [{label: "PDF 4개 범위와 출제 구성", to: "/review"}] },
    { id: "archive", label: "이전 자료 보관함", path: "/archive", Icon: ChartNoAxesCombined, items: [{label:"이전 강의 전체 (범위 구분)",to:"/lessons?archive=1"}, ...topics.map(t=>({label:`이전 · ${t.title}`,to:`/lessons/chapter/${t.id}`})),{label:"이전 가상 데이터 자료",to:"/reading"}, ...blueprints.map(b=>({label:`이전 · ${b.title}`,to:`/cbt/${b.id}`})),{label:"이전 학습 안내",to:"/archive/guide"}] },
    { id: "account", label: "계정·백업", path: "/account", Icon: CircleUserRound, items: [{label: "로컬 로그인·프로필", to: "/account"}, {label: "로컬 회원가입", to: "/account?view=register"}, {label: "학습 기록 백업·복원", to: "/account?view=backup"}] },
  ];
  const oldLesson = /^\/lessons\/(?:chapter\/)?[A-H](?:\d+)?$/.test(location.pathname) && !/^\/lessons\/chapter\/F[123]$/.test(location.pathname);
  const active = oldLesson || location.search.includes('archive=1') || location.pathname.startsWith('/archive') || location.pathname.startsWith('/reading') ? "archive" : location.pathname === "/guide" ? "home"
    : location.pathname === "/quiz" ? (profile.draft?.mode === "exam" ? "mock" : "cbt")
    : location.pathname.startsWith("/results") ? "records"
    : location.pathname === "/practice" ? (location.search.includes("wrong=1") ? "wrong" : "records")
    : groups.find((g) => g.path !== "/" && location.pathname.startsWith(g.path))?.id ?? "home";
  const [open, setOpen] = useState<Record<string, boolean>>({[active]: true});
  useEffect(() => { setOpen((p) => ({...p, [active]: true})); }, [active, location.pathname, location.search]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const child = document.querySelector('.sidebar-nav a[aria-current="page"]');
      const group = child?.closest('.nav-group');
      const parent = group?.querySelector('.nav-parent');
      const target = parent?.getAttribute('href') === child?.getAttribute('href')
        ? group?.querySelector('.nav-heading') : child;
      target?.scrollIntoView({block: "nearest"});
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);
  const renderItem = (item: Item) => <Link key={item.to} to={item.to} className={`nav-child ${current(item.to, location.pathname, location.search) ? "active" : ""}`} aria-current={current(item.to, location.pathname, location.search) ? "page" : undefined}>
    <span>{item.label}</span>{item.completed && <Check size={13} aria-label="읽기 완료" />}
  </Link>;
  return <nav className="sidebar-nav" aria-label="주요 메뉴">
    {groups.map(({id, label, path, Icon, items}) => <div className={`nav-group ${active === id ? "current-group" : ""}`} key={id}>
      <div className="nav-heading">
        <Link className={`nav-parent ${active === id ? "active" : ""}`} to={path} onClick={() => setOpen((p) => ({...p, [id]: true}))}><Icon size={19} /><span>{label}</span>{id === "wrong" && profile.wrongNotes.some((w) => !w.resolved) && <span className="nav-count">{profile.wrongNotes.filter((w) => !w.resolved).length}</span>}</Link>
        <button className="nav-toggle" aria-label={`${label} 세부 페이지 ${open[id] ? "접기" : "펼치기"}`} aria-expanded={!!open[id]} aria-controls={`nav-${id}`} onClick={() => setOpen((p) => ({...p, [id]: !p[id]}))}><ChevronDown size={17} /></button>
      </div>
      <div className="nav-children" id={`nav-${id}`} hidden={!open[id]}>
        {items.map(renderItem)}
      </div>
    </div>)}
  </nav>;
}
