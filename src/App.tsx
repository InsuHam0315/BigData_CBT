import { Heading, BookmarkButton } from "./components/UI";
import { useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  CircleUserRound,
  ClipboardList,
  Database,
  FlaskConical,
  GraduationCap,
  House,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Target,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { StudyProvider, useStudy } from "./context";
import {
  cases,
  caseMap,
  lessons,
  lessonMap,
  questions,
  topics,
} from "./content";
import {
  guestSession,
  readLesson,
  toggleBookmark,
  updateProfile,
} from "./storage";
import { topicStats } from "./engine";
import { Code, Materials, Sources } from "./components/Materials";
import { FinalHome, FinalGuide, LessonEntry, FinalStart } from "./pages/FinalStudy";
import { finalLessons, finalTopics } from "./content";
import { Auth, Records, WrongNotes } from "./pages/Records";
import { Quiz, Results } from "./pages/Quiz";
import { FocusPracticeStart } from "./pages/QuizStart";
import { SidebarNav } from "./components/SidebarNav";
import { Guide } from "./pages/Guide";
import { Handouts } from "./pages/Handouts";
import "./style.css";
function Shell() {
  const {
    session,
    profile,
    ready,
    error,
    notice,
    busy,
    run,
    switchSession,
    setError,
  } = useStudy();
  const [mobile, setMobile] = useState(false);
  const [sidebarClosed,setSidebarClosed] = useState(()=>{
    try{return localStorage.getItem('bigdata-midterm-cbt:sidebar-closed')==='true';}
    catch{return false;}
  });
  function closeSidebar(){
    if(matchMedia('(max-width: 760px)').matches){setMobile(false);return;}
    setSidebarClosed(true);
    requestAnimationFrame(()=>document.getElementById('sidebar-reopen')?.focus());
  }
  useEffect(()=>{
    try{localStorage.setItem('bigdata-midterm-cbt:sidebar-closed',String(sidebarClosed));}
    catch{/* The menu remains usable when preference storage is unavailable. */}
  },[sidebarClosed]);
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if(!mobile)return;
    const previous=document.activeElement as HTMLElement|null;
    const aside=document.querySelector<HTMLElement>('.sidebar');
    aside?.querySelector<HTMLElement>('a')?.focus();
    const close=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setMobile(false);
      if(event.key==='Tab'){
        const items=[...aside!.querySelectorAll<HTMLElement>('a,button')].filter(el=>el.getClientRects().length>0);
        if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
      }
    };
    window.addEventListener('keydown',close);
    return()=>{window.removeEventListener('keydown',close);previous?.focus();};
  }, [mobile]);
  const completed = finalLessons.filter(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed)).length;
  if (!ready)
    return (
      <div className="loading">
        <Database />
        <p>학습 기록을 불러오는 중…</p>
      </div>
    );
  return (
    <div className={`app-shell ${sidebarClosed?'sidebar-closed':''}`}>
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>
      {mobile && <button className="sidebar-backdrop" aria-label="메뉴 닫기" onClick={() => setMobile(false)} />}
      <aside id="study-sidebar" className={`sidebar glass ${mobile ? "open" : ""}`} inert={sidebarClosed&&!mobile}>
        <div className="sidebar-brand-row">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Database size={22} />
          </span>
          <span>
            빅데이터 학습실<small>EXAM STUDY LAB</small>
          </span>
        </Link>
        <button className="sidebar-collapse icon-btn" title="왼쪽 메뉴 접기" aria-label="왼쪽 메뉴 접기" aria-expanded={mobile||!sidebarClosed} aria-controls="study-sidebar" onClick={closeSidebar}><PanelLeftClose size={19}/></button>
        </div>
        <p className="sidebar-label">LEARN · READ · PRACTICE</p>
        <SidebarNav />
        <div className="sidebar-bottom">
          <div className="mini-progress">
            <span>강의 진행</span>
            <b>
              {completed} / {finalTopics.length}장
            </b>
          </div>
          <progress max={finalTopics.length} value={completed} />
          <p>자료를 읽고, 근거로 답하기.</p>
          <Link to="/account">
            <CircleUserRound size={17} />
            {session.displayName} · 로컬 프로필
          </Link>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar glass">
          <div className="topbar-left">
            {sidebarClosed&&<button id="sidebar-reopen" className="desktop-menu icon-btn" title="왼쪽 메뉴 펼치기" aria-label="왼쪽 메뉴 펼치기" aria-expanded={false} aria-controls="study-sidebar" onClick={()=>{setSidebarClosed(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.sidebar-collapse')?.focus());}}><PanelLeftOpen size={21}/></button>}
            <button
              className="mobile-menu icon-btn"
              aria-label="메뉴 열기"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span className="crumb">
              BIG DATA <span>/</span> 최종 범위 학습
            </span>
          </div>
          <div className="topbar-actions">
            <span className="save-state" role="status">
              {busy
                ? "저장 중…"
                : notice
                  ? "저장 상태 확인됨"
                  : "브라우저 로컬 기록"}
            </span>
            <button
              className="icon-btn"
              aria-label="테마 전환"
              onClick={() =>
                void run(
                  updateProfile(session.userId, (p) => {
                    p.settings.theme =
                      p.settings.theme === "dark" ? "light" : "dark";
                  }),
                )
              }
            >
              {profile.settings.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <Link className="user-chip" to="/account">
              <span className="avatar">{session.displayName[0]}</span>
              {session.displayName}
              <small>{session.guest ? "게스트" : "로컬"}</small>
            </Link>
            {!session.guest && (
              <button
                className="icon-btn"
                aria-label="로그아웃"
                onClick={() =>
                  void switchSession(guestSession()).catch((e) =>
                    setError(e.message),
                  )
                }
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {error && (
            <div className="error-banner" role="alert">
              <TriangleAlert size={18} />
              {error}
              <button aria-label="오류 닫기" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {notice}
          </div>
          <Routes>
            <Route path="/" element={<FinalHome />} />
            <Route path="/archive" element={<><div className="notice archive-notice">이전 자료 보관함 · 아래 자료는 이번 최종 범위와 구분해서 보세요.</div><Home /></>} />
            <Route path="/archive/guide" element={<Guide />} />
            <Route path="/archive/review" element={<Review />} />
            <Route path="/guide" element={<FinalGuide />} />
            <Route path="/handouts/:documentId?" element={<Handouts key={location.pathname} />} />
            <Route path="/lessons/*" element={<LessonEntry />} />
            <Route
              path="/reading"
              element={<Reading key={location.search} />}
            />
            <Route
              path="/cbt/:roundId?"
              element={
                <FinalStart key={"cbt" + session.userId + location.pathname + location.search} />
              }
            />
            <Route
              path="/mock/:roundId?"
              element={<FinalStart key={"mock" + session.userId + location.pathname} mock />}
            />
            <Route path="/practice" element={<FocusPracticeStart key={session.userId + location.search} />} />
            <Route path="/quiz" element={<Quiz key={session.userId} />} />
            <Route
              path="/results/:id"
              element={<Results key={session.userId} />}
            />
            <Route path="/wrong" element={<WrongNotes key={session.userId + location.search} />} />
            <Route path="/records" element={<Records />} />
            <Route path="/review" element={<FinalGuide />} />
            <Route path="/account" element={<Auth key={session.userId + location.search} />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>페이지를 찾을 수 없습니다.</h1>
                  <Link to="/">홈으로</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer>
          최종 범위 PDF 1~3장 · 직접 작성한 예상문제{" "}
          <span>학습 기록은 현재 브라우저에 보관</span>
        </footer>
      </div>
    </div>
  );
}
function Home() {
  const { session, profile } = useStudy();
  const complete = topics.filter(t=>lessons.filter(l=>l.topic===t.id).every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed))).length,
    wrong = profile.wrongNotes.filter((w) => !w.resolved),
    recent = profile.attempts.at(-1);
  const stats = topicStats(profile.attempts);
  const next =
    profile.lastLessonId ??
    lessons.find(
      (l) => !profile.progress.some((p) => p.lessonId === l.id && p.completed),
    )?.id ??
    lessons[0].id;
  return (
    <>
      <div className="welcome">
        <span className="eyebrow">YOUR STUDY SPACE</span>
        <p>{session.displayName}님, 오늘도 한 개의 근거부터.</p>
        <span className="tag">4개 주자료 · 중간고사 범위</span>
      </div>
      <section className="hero glass">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" /> 데이터로 이해하는 빅데이터
          </div>
          <h1>
            수업의 핵심부터,
            <br />
            <em>표와 코드로 풀어가는</em> 중간고사.
          </h1>
          <p>
            개념을 배우고, 표와 그래프에서 근거를 찾으세요.
            <br />한 작품의 행부터 추천 행렬까지 이어지는 학습실입니다.
          </p>
          <div className="actions">
            <Link className="button primary" to={`/lessons/${next}`}>
              {complete ? "이어서 학습" : "첫 강의 시작"}
              <ArrowRight size={17} />
            </Link>
            <Link className="button" to="/reading">
              데이터 읽어 보기
              <ChartNoAxesCombined size={17} />
            </Link>
          </div>
          <div className="hero-facts">
            <span>
              <BookOpen size={15} />
              {topics.length}장 · 장별 한 페이지
            </span>
            <span>
              <Database size={15} />
              {cases.length}개 사례
            </span>
            <span>
              <FlaskConical size={15} />
              {questions.length}문항
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-heading">
            <span>DATA READING LAB</span>
            <span className="tag">가상 카탈로그</span>
          </div>
          <div className="mini-chart">
            <div className="mini-bars">
              <div>
                <span className="bar-fill" style={{ height: "75%" }} />
                <b>{caseMap.C24.rows[0].count}</b>
                <small>Movie</small>
              </div>
              <div>
                <span className="bar-fill violet" style={{ height: "50%" }} />
                <b>{caseMap.C24.rows[1].count}</b>
                <small>TV Show</small>
              </div>
            </div>
            <div className="chart-caption">작품 수와 시청 인기는 다를까요?</div>
          </div>
          <Link to="/reading?case=C24" className="visual-link">
            사례 C24에서 근거 찾기
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      {session.guest && (
        <div className="guest-note">
          <CircleUserRound size={18} />
          <p>
            게스트로 바로 학습할 수 있어요. 로컬 계정은 같은 브라우저에서
            사용자별 기록을 나눠 보관합니다.
          </p>
          <Link to="/account">
            로그인 / 가입
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <section className="stat-grid">
        {[
          [
            "읽은 강의",
            `${complete} / ${topics.length}장`,
            "이해의 출발점",
            BookOpen,
          ],
          [
            "최근 점수",
            recent?.score === null
              ? "자기 평가 대기"
              : recent
                ? `${recent.score}점`
                : "기록 없음",
            "저장된 최근 응시",
            ChartNoAxesCombined,
          ],
          [
            "응시 기록",
            `${profile.attempts.length}회`,
            "연습과 모의고사",
            Timer,
          ],
          [
            "복습할 오답",
            `${wrong.length}문항`,
            "해결 표시 전 항목",
            ClipboardList,
          ],
        ].map(([label, value, sub, Icon]) => {
          const I = Icon as typeof BookOpen;
          return (
            <div className="stat-card glass" key={String(label)}>
              <I size={19} />
              <span>{String(label)}</span>
              <strong>{String(value)}</strong>
              <small>{String(sub)}</small>
            </div>
          );
        })}
      </section>
      <section className="learning-flow">
        <div className="section-title">
          <h2>이렇게 공부해 보세요</h2>
          <span>강의 → 자료 읽기 → 풀이 → 복습</span>
        </div>
        <div className="flow-grid">
          {[
            [
              "01",
              "개념을 이해하기",
              "쉽게 풀어 쓴 설명과 줄별 코드 해설",
              "/lessons",
            ],
            [
              "02",
              "데이터에서 근거 찾기",
              "축·단위·분모를 확인하는 작은 실습",
              "/reading",
            ],
            [
              "03",
              "사례로 연결하기",
              "전 범위를 섞은 회차별 종합 문제",
              "/cbt",
            ],
            [
              "04",
              "틀린 이유 돌아보기",
              "연결 강의로 돌아가 오해 바로잡기",
              "/wrong",
            ],
          ].map(([n, t, d, path]) => (
            <Link className="flow-card" key={n} to={path}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
      <div className="home-bottom">
        <section>
          <div className="section-title">
            <h2>시험 범위, 한눈에</h2>
            <Link to="/lessons">
              전체 강의
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="topic-grid">
            {topics.map((t) => {
              const ls = lessons.filter((l) => l.topic === t.id),
                done = ls.filter((l) =>
                  profile.progress.some(
                    (p) => p.lessonId === l.id && p.completed,
                  ),
                ).length;
              return (
                <Link
                  key={t.id}
                  className="topic-card panel"
                  to={`/lessons/chapter/${t.id}`}
                >
                  <span className="topic-letter">{t.id}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.subtitle}</p>
                    <progress value={done} max={ls.length} />
                    <small>
                      {done}/{ls.length} 단원 ·{" "}
                      {stats[t.id]
                        ? `${Math.round((stats[t.id].correct / stats[t.id].total) * 100)}% 정답률`
                        : "아직 응시하지 않음"}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <aside className="today panel">
          <div className="section-title">
            <h2>오늘의 학습</h2>
            <GraduationCap size={22} />
          </div>
          {profile.draft && (
            <Link className="today-row" to="/quiz">
              <Timer size={18} />
              <div>
                <strong>진행 중 풀이</strong>
                <p>
                  {profile.draft.title} ·{" "}
                  {Object.keys(profile.draft.answers).length}/
                  {profile.draft.questionIds.length} 응답
                </p>
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
          <Link className="today-row" to={`/lessons/${next}`}>
            <BookOpen size={18} />
            <div>
              <strong>{lessonMap[next].title}</strong>
              <p>이어서 읽을 강의</p>
            </div>
            <ArrowRight size={16} />
          </Link>
          {wrong.length ? (
            <Link className="today-row" to="/wrong">
              <ClipboardList size={18} />
              <div>
                <strong>복습할 오답 {wrong.length}개</strong>
                <p>단위·분모·계산 과정을 확인하세요</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <p className="empty small">
              아직 오답이 없습니다.
              <br />
              사례형 CBT로 첫 기록을 만들어 보세요.
            </p>
          )}
          <div className="notice">
            종합모의고사 1~5회차 · 회차별 50문항. 시험 시간은 기본 75분에서 조절할 수 있습니다.
          </div>
        </aside>
      </div>
    </>
  );
}
function Reading() {
  const location = useLocation(), navigate = useNavigate();
  const initial = new URLSearchParams(location.search).get("case");
  const [step, setStep] = useState(0);
  const kind = new URLSearchParams(location.search).get("kind") ?? "";
  const cid = initial ?? "";
  const data = caseMap[cid];
  if (!initial) {
    const visible = cases.filter((c) => kind === "graph" ? !!c.chart : kind === "code" ? !!c.code : kind === "table" ? !c.chart : true);
    return <>
      <div className="notice archive-notice">이전 가상 데이터 자료입니다. <Link to="/lessons">최종 범위 필기노트 →</Link></div>
      <Heading eyebrow="DATA READING LAB" title={kind === "graph" ? "그래프 자료 읽기" : kind === "code" ? "코드 자료 읽기" : kind === "table" ? "표 중심 자료 읽기" : "자료를 읽고, 근거를 찾기."} description="수업 범위에 맞춘 가상 자료입니다. 각 자료에서 축·단위·분모·코드 순서와 해석의 한계를 확인하세요." />
      <div className="actions catalogue-tabs">{[["", "전체 자료"], ["table", "표 중심"], ["graph", "그래프"], ["code", "코드"]].map(([k, label]) => <Link key={k} className={`button ${kind === k ? "primary" : ""}`} to={k ? `/reading?kind=${k}` : "/reading"} aria-current={kind === k ? "page" : undefined}>{label}</Link>)}</div>
      <p className="muted">{visible.length}개 자료</p>
      <div className="case-grid">{visible.map((c) => <article key={c.id} className="panel case-card"><div className="tags"><span className="tag">{c.id}</span><span className="tag">{c.chart ? "그래프" : "표"}{c.code ? " · 코드" : ""}</span></div><h2>{c.title}</h2><p>{c.scenario}</p><Link className="button" to={`/reading?case=${c.id}`}>자료 읽기<ArrowRight size={15} /></Link></article>)}</div>
    </>;
  }
  if (!data) return <div className="empty panel"><h1>자료를 찾을 수 없습니다.</h1><Link to="/reading">전체 자료 보기</Link></div>;
  return (
    <>
      <Heading
        eyebrow="DATA READING LAB"
        title="데이터가 말하는 만큼만."
        description="표를 바꿔 보고, 계산 기준을 확인하고, 그래프의 한계를 설명해 보세요."
      />
      <Link className="back-link" to="/reading">← 전체 자료</Link>
      <div className="reading-select">
        <label>
          사례 선택
          <select
            value={cid}
            onChange={(e) => {
              navigate(`/reading?case=${e.target.value}`);
              setStep(0);
            }}
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.title}
              </option>
            ))}
          </select>
        </label>
        <div className="actions compact">
          {[
            ["C18", "결측 전후"],
            ["C20", "다중값 펼치기"],
            ["C24", "건수 ↔ 구성비"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={cid === id}
              onClick={() => {
                navigate(`/reading?case=${id}`);
                setStep(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="reading-layout">
        <Materials key={cid} data={data} interactive />
        <aside className="reading-guide panel">
          <span className="eyebrow">READ IN FIVE STEPS</span>
          <h2>어떤 순서로 읽을까요?</h2>
          {[
            "축·열·단위",
            "범례와 조건",
            "분모와 유효 N",
            "같은 기준 비교",
            "해석의 한계",
          ].map((t, i) => (
            <button
              key={t}
              className={step === i ? "selected" : ""}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              {t}
            </button>
          ))}
          <p className="guide-text">{data.guide[step]}</p>
          <Link className="button primary" to={`/practice?case=${cid}`}>
            이 자료 확인 문제
            <ArrowRight size={15} />
          </Link>
          <Link className="button" to={`/lessons/${data.lessonId}`}>
            연결 강의
          </Link>
          <Sources refs={data.sources} supplements={data.supplements} />
        </aside>
      </div>
    </>
  );
}
function Review() {
  const params = new URLSearchParams(useLocation().search);
  const selectedTopic = params.get("topic"), checklist = params.get("view") === "checklist";
  const visible = topics.filter((t) => !selectedTopic || t.id === selectedTopic);
  return (
    <>
      <Heading
        eyebrow="LAST-MINUTE REVIEW"
        title={checklist ? "자료 해석 체크리스트" : selectedTopic ? `${visible[0]?.title ?? "선택 범위"} · 시험 직전 정리` : "시험 직전, 기준을 다시 확인."}
        description="용어보다 비교 기준을 기억하세요. 각 정리에서 대표 문제로 바로 연결됩니다."
      />
      {!checklist && <div className="review-grid">
        {visible.map((t) => (
          <section className="panel review-card" key={t.id}>
            <span className="topic-letter">{t.id}</span>
            <h2>{t.title}</h2>
            {lessons
              .filter((l) => l.topic === t.id)
              .map((l) => (
                <details key={l.id}>
                  <summary>{l.title}</summary>
                  <div className="table-scroll">
                    <table>
                      <tbody>
                        {l.terms.map((r, i) => (
                          <tr key={i}>
                            {r.map((v, j) => (
                              <td key={j}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Code code={l.code} />
                  <ul>
                    {l.mistakes.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="actions">
                    <Link className="button" to={`/lessons/${l.id}`}>
                      강의
                    </Link>
                    <Link
                      className="button primary"
                      to={`/practice?case=${l.caseIds[0]}`}
                    >
                      대표 문제
                    </Link>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>}
      <section className="panel">
        <h2>마지막 5단계</h2>
        <ol>
          <li>축·관찰 단위: 한 행, 점, 셀은 무엇인가?</li>
          <li>범례·필터: 무엇을 남기고 무엇을 제외했는가?</li>
          <li>분모·단위: 전체, 비결측, 고유 작품, 관계 중 무엇인가?</li>
          <li>비교: 같은 기간·같은 기준인가?</li>
          <li>한계: 추가 자료 없이 선호·인과·전체 역사로 확대하지 않았는가?</li>
        </ol>
      </section>
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <StudyProvider>
        <Shell />
      </StudyProvider>
    </HashRouter>
  );
}
