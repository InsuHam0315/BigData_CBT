import { Heading, BookmarkButton } from "./components/UI";
import { useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
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
import { LessonPrimer, WorkedExamples, LessonLab, LessonSelfChecks, LessonSummary } from "./components/LessonStudy";
import { Auth, Records, WrongNotes } from "./pages/Records";
import { Quiz, QuizStart, Results } from "./pages/Quiz";
import "./style.css";
const menus = [
  ["/", "홈", House],
  ["/lessons", "강의실", BookOpen],
  ["/reading", "데이터 읽기 연습", ChartNoAxesCombined],
  ["/cbt", "사례형 CBT", FlaskConical],
  ["/mock", "모의고사", Timer],
  ["/wrong", "오답노트", ClipboardList],
  ["/records", "학습기록", Layers],
  ["/review", "시험 직전 정리", Target],
] as const;
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
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const completed = profile.progress.filter((p) => p.completed).length;
  if (!ready)
    return (
      <div className="loading">
        <Database />
        <p>학습 기록을 불러오는 중…</p>
      </div>
    );
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>
      <aside className={`sidebar glass ${mobile ? "open" : ""}`}>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Database size={22} />
          </span>
          <span>
            빅데이터 학습실<small>MIDTERM STUDY LAB</small>
          </span>
        </Link>
        <p className="sidebar-label">LEARN · READ · PRACTICE</p>
        <nav aria-label="주요 메뉴">
          {menus.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Icon size={19} />
              <span>{label}</span>
              {path === "/wrong" &&
                profile.wrongNotes.some((w) => !w.resolved) && (
                  <span className="nav-count">
                    {profile.wrongNotes.filter((w) => !w.resolved).length}
                  </span>
                )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-progress">
            <span>강의 진행</span>
            <b>
              {completed} / {lessons.length}
            </b>
          </div>
          <progress max={lessons.length} value={completed} />
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
            <button
              className="mobile-menu icon-btn"
              aria-label="메뉴 열기"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span className="crumb">
              BIG DATA <span>/</span> 중간고사 학습
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
            <Route path="/" element={<Home />} />
            <Route path="/lessons/*" element={<Classroom />} />
            <Route
              path="/reading"
              element={<Reading key={location.search} />}
            />
            <Route
              path="/cbt"
              element={
                <QuizStart key={"cbt" + session.userId + location.search} />
              }
            />
            <Route
              path="/mock"
              element={<QuizStart key={"mock" + session.userId} mock />}
            />
            <Route path="/quiz" element={<Quiz key={session.userId} />} />
            <Route
              path="/results/:id"
              element={<Results key={session.userId} />}
            />
            <Route path="/wrong" element={<WrongNotes />} />
            <Route path="/records" element={<Records />} />
            <Route path="/review" element={<Review />} />
            <Route path="/account" element={<Auth key={session.userId} />} />
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
          직접 작성한 예상 연습문제 · 실제 시험 규격은 미확정{" "}
          <span>원본 PDF는 로컬 분석 자료로 보존</span>
        </footer>
      </div>
    </div>
  );
}
function Home() {
  const { session, profile } = useStudy();
  const complete = profile.progress.filter((p) => p.completed).length,
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
            처음부터 차근차근,
            <br />
            <em>읽고 이해하는</em> 중간고사.
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
              {lessons.length}개 강의
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
            `${complete} / ${lessons.length}`,
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
              "같은 자료에서 서로 다른 판단 연습",
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
                  to={`/lessons?topic=${t.id}`}
                >
                  <span className="topic-letter">{t.id}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.subtitle}</p>
                    <progress value={done} max={ls.length} />
                    <small>
                      {done}/{ls.length} 강의 ·{" "}
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
            모의고사 기본값 40문항·60분은 조절 가능한 학습 설정입니다.
          </div>
        </aside>
      </div>
    </>
  );
}
function Classroom() {
  const location = useLocation(),
    id = location.pathname.split("/")[2];
  const [query, setQuery] = useState(""),
    [topic, setTopic] = useState(
      new URLSearchParams(location.search).get("topic") ?? "",
    );
  const { profile, session, run } = useStudy();
  const [check, setCheck] = useState(false);
  const lesson = id ? lessonMap[id] : null;
  useEffect(() => {
    setCheck(false);
    if (lesson) void run(readLesson(session.userId, lesson.id));
  }, [id, session.userId]);
  if (id && !lesson)
    return (
      <div className="empty">
        존재하지 않는 강의입니다.<Link to="/lessons">강의 목록</Link>
      </div>
    );
  if (lesson) {
    const done = profile.progress.some(
        (p) => p.lessonId === lesson.id && p.completed,
      ),
      index = lessons.indexOf(lesson);
    const anchors = [
      ["start", "처음 배우는 분께"],
      ["goals", "학습목표"],
      ...lesson.sections.map((s, i) => [`section-${i}`, s.heading]),
      ["worked", "표·그래프 단계별 풀이"],
      ["terms", "용어와 비교"],
      ["lab", "코드 입출력 따라가기"],
      ["code", "수업 코드·도식"],
      ["read", "읽는 순서"],
      ["mistakes", "실수·시험 포인트"],
      ["check", "확인 문제"],
      ["self-checks", "자가 점검 3문제"],
      ["summary", "핵심 정리"],
      ["cases", "연결 사례"],
    ];
    const contents = anchors.map(([anchor, title]) => (
      <button key={anchor} onClick={() => document.getElementById(anchor)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })}>{title}</button>
    ));
    return (
      <>
        <div className="lesson-top">
          <Link to="/lessons">← 강의 목록</Link>
          <BookmarkButton targetId={lesson.id} kind="lesson" />
        </div>
        <Heading
          eyebrow={`${lesson.topic} · ${lesson.id} · 약 ${lesson.minutes}분`}
          title={lesson.title}
          description="기초부터 개념 이해 · 표와 그래프의 단계별 풀이 · 코드 입출력 · 자가 점검"
        />
        <div className="lesson-layout">
          <article className="lesson-article panel">
            <details className="mobile-lesson-toc" key={`toc-${lesson.id}`}>
              <summary>강의 목차 · 바로가기</summary>
              <nav aria-label="강의 목차">{contents}</nav>
            </details>
            <LessonPrimer key={`start-${lesson.id}`} lesson={lesson} />
            <section id="goals">
              <h2>학습목표</h2>
              <ul>
                {lesson.objectives.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
            {lesson.sections.map((s, i) => (
              <section key={s.heading} id={`section-${i}`}>
                <span className="eyebrow">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>{s.heading}</h2>
                {s.body.map((b, j) => (
                  <p key={j}>{b}</p>
                ))}
              </section>
            ))}
            <WorkedExamples key={`worked-${lesson.id}`} lesson={lesson} />
            <section id="terms">
              <h2>용어와 비교</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>용어</th>
                      <th>뜻</th>
                      <th>읽을 때 기준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.terms.map((row, i) => (
                      <tr key={i}>
                        {row.map((v, j) => (
                          <td key={j}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <LessonLab key={`lab-${lesson.id}`} lesson={lesson} />
            <section id="code">
              <h2>수업 흐름 코드·도식 읽기</h2>
              <Code code={lesson.code} notes={lesson.codeNotes} />
            </section>
            <section id="read">
              <h2>읽는 순서</h2>
              <ol>
                {lesson.readOrder.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </section>
            <section id="mistakes">
              <h2>자주 하는 실수 · 시험 포인트</h2>
              <ul className="mistakes">
                {lesson.mistakes.map((m) => (
                  <li key={m}>
                    <TriangleAlert size={16} />
                    {m}
                  </li>
                ))}
              </ul>
              {lesson.verification && (
                <div className="notice">{lesson.verification}</div>
              )}
            </section>
            <section id="check" className="lesson-check">
              <span className="eyebrow">QUICK CHECK</span>
              <h2>잠깐 확인</h2>
              <p>{lesson.check.question}</p>
              <button onClick={() => setCheck(!check)}>
                {check ? "답 접기" : "답 확인"}
              </button>
              {check && <p className="explanation">{lesson.check.answer}</p>}
            </section>
            <LessonSelfChecks key={`checks-${lesson.id}`} lesson={lesson} />
            <LessonSummary lesson={lesson} />
            <section id="cases">
              <h2>배운 내용을 사례에 적용하기</h2>
              {lesson.caseIds.map((cid) => (
                <div className="linked-case" key={cid}>
                  <div>
                    <span className="tag">{cid}</span>
                    <strong>{caseMap[cid].title}</strong>
                  </div>
                  <div className="actions compact">
                    <Link className="button" to={`/reading?case=${cid}`}>
                      자료 읽기
                    </Link>
                    <Link className="button primary" to={`/cbt?case=${cid}`}>
                      5문항 연습
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </section>
            <Sources refs={lesson.sources} supplements={lesson.supplements} />
            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  void run(readLesson(session.userId, lesson.id, !done))
                }
              >
                <Check size={16} />
                {done ? "읽기 완료 해제" : "읽기 완료"}
              </button>
              {lessons[index + 1] && (
                <Link
                  className="button"
                  to={`/lessons/${lessons[index + 1].id}`}
                >
                  다음 강의
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </article>
          <aside className="lesson-toc panel">
            <h3>이 강의의 목차</h3>
            {contents}
            <span className="tag">{done ? "✓ 읽기 완료" : "읽는 중"}</span>
          </aside>
        </div>
      </>
    );
  }
  const visible = lessons.filter(
    (l) =>
      (!topic || l.topic === topic) &&
      `${l.title} ${l.tags.join(" ")} ${l.sections.map((s) => s.body.join(" ")).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="CLASSROOM"
        title="개념부터, 차근차근."
        description="주자료의 모든 단원을 쉽게 다시 구성했습니다. 검색·태그·주제로 필요한 부분을 바로 찾으세요."
      />
      <div className="filters">
        <label>
          강의 검색
          <input
            placeholder="예: 분모, 메모리, TF-IDF"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          주제
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">모든 주제</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}. {t.title}
              </option>
            ))}
          </select>
        </label>
        <span>{visible.length}개 강의</span>
      </div>
      <div className="lesson-cards">
        {visible.map((l) => (
          <article className="lesson-card panel" key={l.id}>
            <div className="lesson-card-top">
              <span className="topic-letter">{l.id}</span>
              <BookmarkButton targetId={l.id} kind="lesson" />
            </div>
            <Link to={`/lessons/${l.id}`}>
              <h2>{l.title}</h2>
              <p>{l.objectives[0]}</p>
              <div className="tags">
                {l.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
            <div className="card-bottom">
              <span>
                {profile.progress.some(
                  (p) => p.lessonId === l.id && p.completed,
                )
                  ? "✓ 읽기 완료"
                  : `약 ${l.minutes}분 · ${l.caseIds.length}개 사례`}
              </span>
              <Link to={`/lessons/${l.id}`}>
                학습하기
                <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="empty">검색 조건에 맞는 강의가 없습니다.</p>
      )}
    </>
  );
}
function Reading() {
  const location = useLocation();
  const initial = new URLSearchParams(location.search).get("case");
  const [cid, setCid] = useState(initial && caseMap[initial] ? initial : "C18"),
    [step, setStep] = useState(0);
  const data = caseMap[cid];
  return (
    <>
      <Heading
        eyebrow="DATA READING LAB"
        title="데이터가 말하는 만큼만."
        description="표를 바꿔 보고, 계산 기준을 확인하고, 그래프의 한계를 설명해 보세요."
      />
      <div className="reading-select">
        <label>
          사례 선택
          <select
            value={cid}
            onChange={(e) => {
              setCid(e.target.value);
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
                setCid(id);
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
          <Link className="button primary" to={`/cbt?case=${cid}`}>
            이 자료로 5문항 풀기
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
  return (
    <>
      <Heading
        eyebrow="LAST-MINUTE REVIEW"
        title="시험 직전, 기준을 다시 확인."
        description="용어보다 비교 기준을 기억하세요. 각 정리에서 대표 문제로 바로 연결됩니다."
      />
      <div className="review-grid">
        {topics.map((t) => (
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
                      to={`/cbt?case=${l.caseIds[0]}`}
                    >
                      대표 문제
                    </Link>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>
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
