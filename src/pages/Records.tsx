import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Download, LogOut, Upload } from "lucide-react";
import { Heading, BookmarkButton } from "../components/UI";
import { useStudy } from "../context";
import { cases, lessons, lessonMap, questionMap, topics } from "../content";
import {
  exportBackup,
  guestSession,
  importBackup,
  login,
  migrateGuest,
  register,
  updateProfile,
  validateBackup,
} from "../storage";
import { topicStats } from "../engine";
import { DataChart } from "../components/Chart";
import { Materials } from "../components/Materials";
import { Explanation, answerText } from "./Quiz";
const date = (s: string) =>
  new Date(s).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export function Auth() {
  const { session, profile, switchSession, run, setError, setNotice } =
    useStudy();
  const [mode, setMode] = useState<"login" | "register">("login"),
    [loginId, setLoginId] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [migrate, setMigrate] = useState(false),
    [working, setWorking] = useState(false),
    [policy, setPolicy] = useState<"merge" | "replace">("merge"),
    [backup, setBackup] = useState<string | null>(null);
  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true);
    setError("");
    const input = password;
    setPassword("");
    try {
      const s =
        mode === "register"
          ? await register(loginId, name, input)
          : await login(loginId, input);
      if (migrate) await migrateGuest(s.userId);
      await switchSession(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportBackup(profile)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `bigdata-learning-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("현재 사용자의 학습 백업을 내보냈습니다.");
  };
  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 10_000_000) throw new Error("백업은 10MB 이하여야 합니다.");
      const t = await f.text();
      validateBackup(t);
      setBackup(t);
      setNotice("백업 구조를 확인했습니다. 적용 버튼으로 복원하세요.");
    } catch (e) {
      setBackup(null);
      setError((e as Error).message);
    }
    e.target.value = "";
  };
  const restore = async () => {
    if (!backup) return;
    const result = await run(importBackup(session.userId, backup, policy));
    if (result) setBackup(null);
  };
  return (
    <>
      <Heading
        eyebrow="LOCAL PROFILE"
        title={
          session.guest
            ? "나의 학습 공간을 만들어요."
            : `${session.displayName}의 로컬 계정`
        }
        description="계정은 현재 브라우저에서 학습 기록을 나누는 개인 프로필입니다. 다른 기기와 자동 동기화되지 않습니다."
      />
      <div className="account-layout">
        <section className="panel account-card">
          <h2>{session.guest ? "로그인 / 회원가입" : "계정 전환"}</h2>
          <p>
            현재 사용자: <b>{session.displayName}</b>
          </p>
          <div className="segmented">
            <button
              aria-pressed={mode === "login"}
              onClick={() => setMode("login")}
            >
              로그인
            </button>
            <button
              aria-pressed={mode === "register"}
              onClick={() => setMode("register")}
            >
              회원가입
            </button>
          </div>
          <form onSubmit={(e) => void authenticate(e)}>
            <label>
              아이디
              <input
                autoComplete="username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="영문·숫자·_·- 3~32자"
              />
            </label>
            {mode === "register" && (
              <label>
                표시 이름
                <input
                  autoComplete="nickname"
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="학습 화면에 보일 이름"
                />
              </label>
            )}
            <label>
              비밀번호
              <input
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "register" ? 8 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "8자 이상" : "비밀번호"}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={migrate}
                onChange={(e) => setMigrate(e.target.checked)}
              />
              게스트 학습 기록을 이 계정에 합치기
            </label>
            <button className="primary" disabled={working} type="submit">
              {working
                ? "확인 중…"
                : mode === "register"
                  ? "로컬 계정 만들기"
                  : "로그인"}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="actions">
            {session.guest ? (
              <Link className="button" to="/">
                게스트로 계속 학습
              </Link>
            ) : (
              <button
                onClick={() =>
                  void switchSession(guestSession()).catch((e) =>
                    setError(e.message),
                  )
                }
              >
                <LogOut size={16} />
                로그아웃
              </button>
            )}
            <Link className="button" to="/records">
              내 기록
            </Link>
          </div>
          <p className="muted">
            비밀번호 원문을 저장하지 않습니다. 이 로컬 기능은 서버 인증이나
            기록의 암호화 격리가 아닙니다.
          </p>
        </section>
        <section className="panel backup-card">
          <h2>학습 기록 백업</h2>
          <p>
            현재 사용자 <b>{session.displayName}</b>의
            응시·오답·진도·북마크·초안·설정만 JSON으로 내보냅니다. 계정 목록,
            비밀번호와 검증값은 포함하지 않습니다.
          </p>
          <button onClick={download}>
            <Download size={16} />내 기록 내보내기
          </button>
          <hr />
          <label>
            복원 정책
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as "merge" | "replace")}
            >
              <option value="merge">합치기 · ID가 같으면 최신 항목</option>
              <option value="replace">덮어쓰기 · 현재 학습 기록 교체</option>
            </select>
          </label>
          <label className="file-input">
            <Upload size={18} />
            백업 파일 선택
            <input
              type="file"
              accept="application/json,.json"
              aria-label="백업 파일 선택"
              onChange={(e) => void choose(e)}
            />
          </label>
          {backup && (
            <div className="notice">
              <p>
                구조 검사를 통과한 백업입니다. 파일 속 사용자 ID에 관계없이{" "}
                <b>{session.displayName}</b>에게만 적용됩니다.
              </p>
              <button className="primary" onClick={() => void restore()}>
                {policy === "merge"
                  ? "현재 사용자에 합치기"
                  : "현재 학습 기록 덮어쓰기"}
              </button>
              <button onClick={() => setBackup(null)}>취소</button>
            </div>
          )}
          <p className="muted">
            합치기는 응시 ID·문제 ID·북마크 키로 중복을 막고 최신 항목을
            유지합니다. 현재 초안이 있으면 가져온 초안보다 우선합니다.
            덮어쓰기는 현재 학습 기록 전체를 바꾸므로 먼저 내보내기 하세요.
          </p>
          <div className="notice">
            브라우저 저장소를 삭제하면 계정과 학습 기록이 사라질 수 있습니다.
            로컬 주소와 배포 주소는 서로 다른 저장소입니다. 같은 주소·포트를
            계속 사용하세요.
          </div>
        </section>
      </div>
    </>
  );
}
export function Records() {
  const { profile, session } = useStudy();
  const stats = topicStats(profile.attempts),
    skills = topicStats(profile.attempts, "skill"),
    mistakes = topicStats(profile.attempts, "mistake");
  const completed = profile.progress.filter((p) => p.completed).length;
  const trend = profile.attempts
    .filter((a) => a.score !== null)
    .slice(-10)
    .map((a, i) => ({ 응시: i + 1, 점수: a.score }));
  const chartCase = {
    ...cases[0],
    chart: {
      type: "line" as const,
      x: "응시",
      y: "점수",
      title: "확정 점수 추이",
      xLabel: "최근 확정 응시 순서",
      yLabel: "점수 (100점 기준)",
    },
    rows: trend,
  };
  return (
    <>
      <Heading
        eyebrow="MY LEARNING RECORD"
        title={`${session.displayName}의 학습기록`}
        description="점수만큼 중요한 것은 틀린 이유입니다. 아직 풀지 않은 주제는 실력 0%로 표시하지 않습니다."
      />
      <div className="record-actions actions">
        <Link className="button" to="/account">
          계정·백업
        </Link>
        <Link className="button" to="/wrong">
          오답 복습
        </Link>
        <Link className="button" to="/cbt?bookmarks=1">
          북마크 문제 풀이
        </Link>
        {profile.draft && (
          <Link className="button primary" to="/quiz">
            이어서 풀기
          </Link>
        )}
      </div>
      <section className="stat-grid">
        <div className="stat-card glass">
          <span>누적 응시</span>
          <strong>{profile.attempts.length}회</strong>
        </div>
        <div className="stat-card glass">
          <span>읽기 완료</span>
          <strong>
            {completed}/{lessons.length}
          </strong>
        </div>
        <div className="stat-card glass">
          <span>복습할 오답</span>
          <strong>
            {profile.wrongNotes.filter((w) => !w.resolved).length}개
          </strong>
        </div>
        <div className="stat-card glass">
          <span>북마크</span>
          <strong>{profile.bookmarks.length}개</strong>
        </div>
      </section>
      <div className="records-layout">
        <section className="panel">
          <h2>점수 추이</h2>
          {trend.length ? (
            <DataChart data={chartCase} />
          ) : (
            <p className="empty">
              확정된 점수가 아직 없습니다.
              <br />
              서술 답안은 자기 평가 뒤 포함됩니다.
            </p>
          )}
        </section>
        <section className="panel">
          <h2>주제별 정답률</h2>
          {topics.map((t) => (
            <div className="weakness-row" key={t.id}>
              <span>
                {t.id}. {t.title}
              </span>
              {stats[t.id] ? (
                <>
                  <b>
                    {Math.round(
                      (stats[t.id].correct / stats[t.id].total) * 100,
                    )}
                    %
                  </b>
                  <small>
                    {stats[t.id].correct}/{stats[t.id].total} · 누적 채점 응답
                  </small>
                </>
              ) : (
                <small>아직 응시하지 않음</small>
              )}
            </div>
          ))}
        </section>
      </div>
      <div className="records-layout">
        {[
          ["학습 기능별 취약점", skills],
          ["실수 유형별 취약점", mistakes],
        ].map(([title, groups]) => (
          <section className="panel" key={String(title)}>
            <h2>{String(title)}</h2>
            {Object.entries(groups as typeof skills).length ? (
              Object.entries(groups as typeof skills).map(([k, s]) => (
                <div className="weakness-row" key={k}>
                  <span>{k}</span>
                  <b>{s.total - s.correct}회 오답</b>
                  <small>
                    {s.correct}/{s.total} 정답 · 자기 평가 포함
                  </small>
                </div>
              ))
            ) : (
              <p className="empty">채점된 응답이 없습니다.</p>
            )}
          </section>
        ))}
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>응시 이력</h2>
          <span>{profile.attempts.length}회</span>
        </div>
        {profile.attempts.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>응시</th>
                  <th>날짜 (한국)</th>
                  <th>정답/전체</th>
                  <th>점수</th>
                  <th>결과</th>
                </tr>
              </thead>
              <tbody>
                {[...profile.attempts].reverse().map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.title}
                      <small>{a.mode === "exam" ? "모의고사" : "연습"}</small>
                    </td>
                    <td>{date(a.updatedAt)}</td>
                    <td>
                      {a.correct}/{a.total}
                    </td>
                    <td>
                      {a.score === null
                        ? `평가 대기 ${a.pending}개`
                        : `${a.score}점`}
                    </td>
                    <td>
                      <Link to={`/results/${a.id}`}>보기 →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            아직 저장된 응시 기록이 없습니다. 사례형 CBT로 첫 기록을 만들어
            보세요.
          </p>
        )}
      </section>
      <section className="panel">
        <h2>북마크</h2>
        {profile.bookmarks.length ? (
          <div className="bookmark-list">
            {profile.bookmarks.map((b) => (
              <div className="linked-case" key={b.kind + b.targetId}>
                <div>
                  <span className="tag">
                    {b.kind === "lesson" ? "강의" : "문제"} · {b.targetId}
                  </span>
                  <strong>
                    {b.kind === "lesson"
                      ? lessonMap[b.targetId].title
                      : questionMap[b.targetId].stem}
                  </strong>
                </div>
                <Link
                  className="button"
                  to={
                    b.kind === "lesson"
                      ? `/lessons/${b.targetId}`
                      : `/cbt?question=${b.targetId}`
                  }
                >
                  {b.kind === "lesson" ? "읽기" : "다시 풀기"}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">강의와 문제의 북마크 버튼으로 저장하세요.</p>
        )}
      </section>
    </>
  );
}
export function WrongNotes() {
  const { profile, session, run } = useStudy();
  const [search, setSearch] = useState(""),
    [topic, setTopic] = useState(""),
    [mistake, setMistake] = useState(""),
    [resolved, setResolved] = useState(false);
  const visible = profile.wrongNotes.filter((w) => {
    const q = questionMap[w.questionId];
    return (
      (resolved || !w.resolved) &&
      (!topic || q.topic === topic) &&
      (!mistake || q.mistake === mistake) &&
      `${q.id} ${q.stem} ${q.explanation}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  return (
    <>
      <Heading
        eyebrow="WRONG ANSWER NOTE"
        title="틀린 이유에서 다시 시작."
        description="같은 문제는 하나의 항목에 오답 횟수와 최근 결과를 갱신합니다. 다시 풀거나 해결 표시를 남겨 보세요."
      />
      <div className="filters">
        <label>
          오답 검색
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="문제 ID·내용 검색"
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
        <label>
          실수 유형
          <select value={mistake} onChange={(e) => setMistake(e.target.value)}>
            <option value="">모든 유형</option>
            {[
              "계산",
              "분모",
              "단위",
              "그래프 읽기",
              "코드",
              "개념",
              "과도한 해석",
            ].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={resolved}
            onChange={(e) => setResolved(e.target.checked)}
          />
          해결한 문제도 보기
        </label>
      </div>
      {visible.map((w) => {
        const q = questionMap[w.questionId],
          data = cases.find((c) => c.id === q.caseId)!;
        return (
          <article className="panel wrong-card" key={w.questionId}>
            <div className="question-top">
              <div className="tags">
                <span className="tag">{q.id}</span>
                <span className="tag">{q.mistake}</span>
                <span className="tag">오답 {w.count}회</span>
                <span className="tag">
                  {w.resolved ? "✓ 해결" : "복습 필요"}
                </span>
              </div>
              <BookmarkButton targetId={q.id} kind="question" />
            </div>
            <h2>{q.stem}</h2>
            <p>
              최근 오답: {answerText(q, w.answer)} · {date(w.updatedAt)}
            </p>
            <details>
              <summary>표·그래프와 해설 펼치기</summary>
              <Materials data={data} />
              <Explanation q={q} answer={w.answer} />
            </details>
            <div className="actions">
              <Link className="button primary" to={`/cbt?question=${q.id}`}>
                재풀이
                <ArrowRight size={15} />
              </Link>
              <Link className="button" to={`/lessons/${q.lessonId}`}>
                <BookOpen size={16} />
                연결 강의
              </Link>
              <button
                onClick={() =>
                  void run(
                    updateProfile(session.userId, (p) => {
                      const n = p.wrongNotes.find((n) => n.questionId === q.id);
                      if (n) {
                        n.resolved = !n.resolved;
                        n.updatedAt = new Date().toISOString();
                      }
                    }),
                  )
                }
              >
                {w.resolved ? "복습 필요로 표시" : "해결 표시"}
              </button>
            </div>
          </article>
        );
      })}
      {!visible.length && (
        <div className="empty panel">
          <h2>이 조건의 오답이 없습니다.</h2>
          <p>
            {profile.wrongNotes.length
              ? "필터를 바꾸거나 해결한 문제를 확인하세요."
              : "제출한 풀이의 오답이 여기에 모입니다."}
          </p>
          <Link className="button primary" to="/cbt">
            사례형 CBT 시작
          </Link>
        </div>
      )}
    </>
  );
}
