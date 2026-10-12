import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Shuffle,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { BookmarkButton, Heading, kindLabel } from "../components/UI";
import { useStudy } from "../context";
import {
  blueprints,
  caseMap,
  cases,
  lessonMap,
  questionMap,
  questions,
  topics,
} from "../content";
import type { Attempt, Question, ExamDraft } from "../types";
import { filters, grade, newDraft, selectQuestions, shuffle } from "../engine";
import {
  evaluateEssay,
  patchDraft,
  submitDraft,
  updateProfile,
} from "../storage";
import { Materials, Sources } from "../components/Materials";
export function answerText(q: Question, value: string | undefined) {
  return !value?.trim()
    ? "미응답"
    : q.kind === "choice"
      ? (q.choices!.find((c) => c.id === value)?.text ?? "유효하지 않은 선지")
      : value;
}
export function correctText(q: Question) {
  return q.kind === "choice"
    ? q.choices!.find((c) => c.id === q.correctId)!.text
    : q.kind === "numeric"
      ? `${q.numeric!.value} ${q.numeric!.unit}`
      : q.modelAnswer;
}
export function Explanation({ q, answer }: { q: Question; answer?: string }) {
  return (
    <div className="explanation">
      <span className="eyebrow">WHY THIS ANSWER</span>
      <h3>정답 · {correctText(q)}</h3>
      {answer !== undefined && <p>내 답: {answerText(q, answer)}</p>}
      <p>{q.explanation}</p>
      <ol>
        {q.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {q.choices && (
        <details>
          <summary>선지별 이유</summary>
          <ul>
            {q.choices.map((c) => (
              <li key={c.id}>
                <b>{c.text}</b> · {c.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {q.kind === "essay" && (
        <>
          <h4>자기 평가 요소</h4>
          <ul>
            {q.rubric!.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mistake-note">흔한 오류: {q.commonError}</p>
      <Link className="button" to={`/lessons/${q.lessonId}`}>
        연결 강의 · {lessonMap[q.lessonId].title}
        <ArrowRight size={14} />
      </Link>
      <Sources refs={q.sources} />
    </div>
  );
}
export function QuizStart({ mock = false }: { mock?: boolean }) {
  const { profile, session, run, setError } = useStudy(),
    location = useLocation(),
    navigate = useNavigate();
  const params = new URLSearchParams(location.search),
    givenCase = params.get("case"),
    givenQ = params.get("question");
  const [topic, setTopic] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [kind, setKind] = useState(""),
    [count, setCount] = useState(mock ? 40 : 10),
    [minutes, setMinutes] = useState(60),
    [onlyBookmarks, setOnlyBookmarks] = useState(
      params.get("bookmarks") === "1",
    ),
    [mix, setMix] = useState(profile.settings.shuffle),
    [selectedCase, setSelectedCase] = useState(
      givenCase && caseMap[givenCase] ? givenCase : "",
    ),
    [blueprint, setBlueprint] = useState("mock-1"),
    [starting, setStarting] = useState(false);
  let pool = filters(questions, topic, difficulty, kind);
  if (onlyBookmarks) {
    const ids = profile.bookmarks
      .filter((b) => b.kind === "question")
      .map((b) => b.targetId);
    pool = pool.filter((q) => ids.includes(q.id));
  }
  if (selectedCase) pool = pool.filter((q) => q.caseId === selectedCase);
  if (givenQ) pool = pool.filter((q) => q.id === givenQ);
  const chosen = blueprints.find((b) => b.id === blueprint)!;
  const planned = selectQuestions({
    pool,
    count: givenQ ? 1 : selectedCase ? 5 : count,
    random: false,
    priority: mock ? chosen.caseIds : [],
  });
  const start = async (random: boolean) => {
    if (!pool.length) {
      setError("조건에 맞는 문제가 없습니다. 필터를 바꿔 주세요.");
      return;
    }
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > questions.length ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 240
    ) {
      setError(
        `문항 수 1~${questions.length}, 시간 1~240분의 정수를 입력하세요.`,
      );
      return;
    }
    setStarting(true);
    const ids = selectQuestions({
      pool,
      count: givenQ ? 1 : selectedCase ? 5 : count,
      random: random && !mock,
      priority: mock ? chosen.caseIds : [],
    }).ids;
    const title = mock
      ? chosen.title
      : selectedCase
        ? caseMap[selectedCase].title
        : onlyBookmarks
          ? "북마크 연습"
          : "사례형 연습";
    const draft = newDraft(
      session.userId,
      mock ? "exam" : "practice",
      title,
      ids,
      minutes,
      mix,
    );
    const result = await run(
      updateProfile(session.userId, (p) => {
        p.draft = draft;
      }),
    );
    setStarting(false);
    if (result) navigate("/quiz");
  };
  return (
    <>
      <Heading
        eyebrow={mock ? "PRACTICE EXAM" : "CASE-BASED CBT"}
        title={mock ? "배운 범위를, 한 번에." : "하나의 자료, 여러 가지 판단."}
        description={
          mock
            ? "학습용 모의고사 3개. 기본 40문항·60분은 실제 시험 규격이 아니며 자유롭게 조절할 수 있습니다."
            : "직접 작성한 예상 연습문제입니다. 연습에서는 문항별 확인 후 해설을 볼 수 있습니다."
        }
      />
      {profile.draft && (
        <div className="notice resume-banner">
          <Timer size={18} />
          <span>
            진행 중인 {profile.draft.title}가 있습니다. 새로 시작하면 진행 중
            초안만 교체됩니다.
          </span>
          <Link className="button primary" to="/quiz">
            이어서 풀기
          </Link>
        </div>
      )}
      {mock && (
        <div className="blueprint-grid">
          {blueprints.map((b) => (
            <button
              className={`panel blueprint ${blueprint === b.id ? "selected" : ""}`}
              key={b.id}
              onClick={() => setBlueprint(b.id)}
              aria-pressed={blueprint === b.id}
            >
              <span className="topic-letter">{b.id.at(-1)}</span>
              <h2>{b.title}</h2>
              <p>{b.description}</p>
              <small>8개 주제의 사례를 우선 배분 · 40문항 기본</small>
            </button>
          ))}
        </div>
      )}
      <section className="panel setup">
        <h2>나에게 맞는 풀이 설정</h2>
        <div className="filters">
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
            난이도
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">모든 난이도</option>
              {["기초", "보통", "심화"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            문제 유형
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">모든 유형</option>
              {Object.entries(kindLabel).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {!mock && (
            <label>
              사례
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
              >
                <option value="">여러 사례</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} · {c.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            목표 문항 수
            <input
              type="number"
              min={1}
              max={questions.length}
              value={selectedCase ? 5 : givenQ ? 1 : count}
              disabled={!!selectedCase || !!givenQ}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
          {mock && (
            <label>
              시간 (분)
              <input
                type="number"
                min={1}
                max={240}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
          )}
        </div>
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={mix}
              onChange={(e) => {
                const value = e.target.checked;
                setMix(value);
                void run(
                  updateProfile(session.userId, (p) => {
                    p.settings.shuffle = value;
                  }),
                );
              }}
            />
            선지 순서 섞기
          </label>
          {!mock && (
            <label>
              <input
                type="checkbox"
                checked={onlyBookmarks}
                onChange={(e) => setOnlyBookmarks(e.target.checked)}
              />
              북마크 문제만
            </label>
          )}
        </div>
        <div className="plan-summary">
          <span>
            가능한 문제 <strong>{pool.length}</strong>개
          </span>
          <span>
            이번 구성 <strong>{planned.ids.length}</strong>문항
          </span>
          <span>
            사례{" "}
            <strong>
              {new Set(planned.ids.map((id) => questionMap[id].caseId)).size}
            </strong>
            개
          </span>
        </div>
        <p className="muted">
          공통 자료의 문항 묶음을 유지해 목표 이하로 구성합니다. 필터나 사례
          묶음 때문에 목표 수보다 적을 수 있으며 문제를 복제하지 않습니다.
          40문항 기본 구성은 A~H 각 5문항입니다.
        </p>
        <div className="actions">
          <button
            className="primary"
            disabled={starting || !pool.length}
            onClick={() => void start(false)}
          >
            {starting
              ? "준비 중…"
              : profile.draft
                ? "새 응시로 교체"
                : mock
                  ? "모의고사 시작"
                  : "고정 순서로 연습"}
            <ArrowRight size={16} />
          </button>
          {!mock && (
            <button
              disabled={starting || !pool.length}
              onClick={() => void start(true)}
            >
              <Shuffle size={16} />
              사례 랜덤으로 연습
            </button>
          )}
        </div>
        <p className="muted">
          미응답은 오답으로 채점합니다. 입력한 서술은 제출 후 자기 평가까지 점수
          확정을 보류합니다.
        </p>
      </section>
      {!pool.length && (
        <p className="empty">
          조건에 맞는 문제가 없습니다. 북마크가 없다면 문제 화면에서 먼저 저장해
          주세요.
        </p>
      )}
      <div className="case-grid">
        {cases
          .filter((c) => pool.some((q) => q.caseId === c.id))
          .map((c) => (
            <article key={c.id} className="panel case-card">
              <div>
                <span className="tag">
                  {c.topic} · {c.id}
                </span>
                <span className="tag">{c.questionIds.length}문항</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.scenario}</p>
              <div className="actions compact">
                <Link className="button" to={`/reading?case=${c.id}`}>
                  자료 읽기
                </Link>
                <Link className="button" to={`/cbt?case=${c.id}`}>
                  사례별 풀이
                </Link>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}
export function Quiz() {
  const { profile, session, run } = useStudy(),
    navigate = useNavigate(),
    draft = profile.draft;
  const [now, setNow] = useState(Date.now()),
    [mobileView, setMobileView] = useState<"question" | "data">("question");
  const submitting = useRef(false);
  const finish = async (expired = false) => {
    if (!draft || submitting.current) return;
    submitting.current = true;
    const result = await run(submitDraft(draft.userId, draft.id, expired));
    if (result?.attempts.some((a) => a.id === draft.id))
      navigate(`/results/${draft.id}`);
    else submitting.current = false;
  };
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (draft?.mode === "exam" && draft.endsAt !== null && now >= draft.endsAt)
      void finish(true);
  }, [now, draft?.id]);
  if (!draft)
    return (
      <div className="empty">
        <h1>진행 중인 풀이가 없습니다.</h1>
        <Link className="button primary" to="/cbt">
          문제 선택
        </Link>
        <Link className="button" to="/records">
          학습기록
        </Link>
      </div>
    );
  const q = questionMap[draft.questionIds[draft.index]],
    data = caseMap[q.caseId],
    answer = draft.answers[q.id] ?? "",
    checked = draft.mode === "practice" && draft.checked.includes(q.id),
    result = checked ? grade(q, answer, draft.selfGrades[q.id]) : null,
    remaining =
      draft.endsAt === null
        ? null
        : Math.max(0, Math.ceil((draft.endsAt - now) / 1000));
  const patch = (fn: (d: ExamDraft) => void) =>
    void run(patchDraft(draft.userId, draft.id, fn));
  const setAnswer = (v: string) =>
    patch((d) => {
      d.answers[q.id] = v;
      d.checked = d.checked.filter((id) => id !== q.id);
      delete d.selfGrades[q.id];
    });
  const order = draft.choiceOrders[q.id] ?? q.choices?.map((c) => c.id) ?? [];
  const gradeSelf = (v: boolean) =>
    patch((d) => {
      d.selfGrades[q.id] = v;
    });
  const answered = draft.questionIds.filter((id) =>
    draft.answers[id]?.trim(),
  ).length;
  return (
    <>
      <div className="quiz-header">
        <div>
          <span className="eyebrow">
            {draft.mode === "exam"
              ? "EXAM MODE · 제출 후 해설 공개"
              : "PRACTICE MODE · 확인 후 해설 공개"}
          </span>
          <h1>{draft.title}</h1>
        </div>
        <div
          className={`timer ${remaining !== null && remaining < 60 ? "urgent" : ""}`}
        >
          <Timer size={18} />
          {remaining === null
            ? "시간 제한 없음"
            : `${Math.floor(remaining / 60)
                .toString()
                .padStart(
                  2,
                  "0",
                )}:${(remaining % 60).toString().padStart(2, "0")}`}
        </div>
      </div>
      <div className="quiz-progress">
        <span>
          {answered}/{draft.questionIds.length} 응답 · 자동 저장
        </span>
        <progress max={draft.questionIds.length} value={answered} />
        <span>
          {draft.mode === "exam"
            ? "시간 만료 시 한 번 자동 제출"
            : "전체 제출 후 오답·기록 저장"}
        </span>
      </div>
      <div className="mobile-quiz-tabs">
        <button
          aria-pressed={mobileView === "question"}
          onClick={() => setMobileView("question")}
        >
          문제
        </button>
        <button
          aria-pressed={mobileView === "data"}
          onClick={() => setMobileView("data")}
        >
          공통 자료
        </button>
      </div>
      <div className="quiz-layout">
        <div
          className={`quiz-material ${mobileView === "data" ? "show-mobile" : ""}`}
        >
          <Materials key={data.id} data={data} />
          <Sources refs={data.sources} />
        </div>
        <div
          className={`quiz-question ${mobileView === "question" ? "show-mobile" : ""}`}
        >
          <section className="panel question-panel">
            <div className="question-top">
              <span className="tag">
                문제 {draft.index + 1} / {draft.questionIds.length}
              </span>
              <BookmarkButton targetId={q.id} kind="question" />
            </div>
            <div className="tags">
              <span className="tag">{q.id}</span>
              <span className="tag">{q.difficulty}</span>
              <span className="tag">{kindLabel[q.kind]}</span>
              <span className="tag">{q.skill}</span>
            </div>
            <h2>{q.stem}</h2>
            {q.kind === "choice" ? (
              <fieldset className="choices">
                <legend className="sr-only">정답 선택</legend>
                {order.map((id, i) => {
                  const choice = q.choices!.find((c) => c.id === id)!;
                  return (
                    <label
                      key={id}
                      className={`choice ${answer === id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={id}
                        checked={answer === id}
                        onChange={() => setAnswer(id)}
                      />
                      <span className="choice-number">{i + 1}</span>
                      <span>{choice.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <label className="answer-input">
                {q.kind === "numeric"
                  ? `${q.numeric!.unit} · ${q.numeric!.rounding} · 허용 오차 ±${q.numeric!.tolerance}`
                  : q.kind === "essay"
                    ? "근거와 해석 한계를 2~4문장으로 적어 보세요."
                    : "지정된 용어로 짧게 입력하세요."}
                {q.kind === "essay" ? (
                  <textarea
                    aria-label="서술 답안"
                    rows={6}
                    maxLength={10000}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                ) : (
                  <input
                    aria-label={
                      q.kind === "numeric" ? "숫자 답안" : "짧은 답안"
                    }
                    type="text"
                    inputMode={q.kind === "numeric" ? "decimal" : "text"}
                    maxLength={1000}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={
                      q.kind === "numeric" ? "숫자만 입력" : "답 입력"
                    }
                  />
                )}
              </label>
            )}
            <div className="question-actions">
              <button
                aria-pressed={draft.reviewed.includes(q.id)}
                onClick={() =>
                  patch((d) => {
                    d.reviewed = d.reviewed.includes(q.id)
                      ? d.reviewed.filter((id) => id !== q.id)
                      : [...d.reviewed, q.id];
                  })
                }
              >
                <Flag size={15} />
                {draft.reviewed.includes(q.id)
                  ? "검토 표시 해제"
                  : "나중에 검토"}
              </button>
              {draft.mode === "practice" && (
                <button
                  className="primary"
                  disabled={!answer.trim()}
                  onClick={() =>
                    patch((d) => {
                      if (!d.checked.includes(q.id)) d.checked.push(q.id);
                    })
                  }
                >
                  답안 확인
                  <Check size={16} />
                </button>
              )}
            </div>
            {checked && (
              <>
                <p
                  className={`grade-status ${result === true ? "correct" : result === false ? "incorrect" : ""}`}
                >
                  {result === null
                    ? "서술 답안 · 자기 평가 대기"
                    : result
                      ? "✓ 정답"
                      : "× 오답"}
                </p>
                <Explanation q={q} answer={answer} />
                {q.kind === "essay" && (
                  <div className="actions">
                    <button
                      onClick={() => gradeSelf(true)}
                      aria-pressed={draft.selfGrades[q.id] === true}
                    >
                      채점 요소를 충족했어요
                    </button>
                    <button
                      onClick={() => gradeSelf(false)}
                      aria-pressed={draft.selfGrades[q.id] === false}
                    >
                      다시 복습할게요
                    </button>
                  </div>
                )}
              </>
            )}
            <div className="prev-next">
              <button
                disabled={draft.index === 0}
                onClick={() =>
                  patch((d) => {
                    d.index--;
                  })
                }
              >
                <ArrowLeft size={16} />
                이전
              </button>
              <button
                disabled={draft.index === draft.questionIds.length - 1}
                onClick={() =>
                  patch((d) => {
                    d.index++;
                  })
                }
              >
                다음
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
          <section className="panel palette-panel">
            <h3>문제 번호</h3>
            <div className="palette">
              {draft.questionIds.map((id, i) => (
                <button
                  key={id}
                  aria-label={`${i + 1}번 ${draft.answers[id]?.trim() ? "응답" : "미응답"}${draft.reviewed.includes(id) ? " 검토" : ""}`}
                  aria-current={draft.index === i ? "step" : undefined}
                  className={`${draft.answers[id]?.trim() ? "answered" : ""} ${draft.reviewed.includes(id) ? "reviewed" : ""} ${i === draft.index ? "current" : ""}`}
                  onClick={() =>
                    patch((d) => {
                      d.index = i;
                    })
                  }
                >
                  {i + 1}
                  {draft.reviewed.includes(id) && <Flag size={9} />}
                </button>
              ))}
            </div>
            <p className="muted">
              빈 칸=미응답 · 채움=응답 · ⚑=검토 · 테두리=현재
            </p>
            <button
              className="primary submit"
              disabled={submitting.current}
              onClick={() => void finish(false)}
            >
              전체 제출 · 미응답 {draft.questionIds.length - answered}개
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
export function Results() {
  const { id } = useParams(),
    { profile, session, run } = useStudy();
  const a = profile.attempts.find((a) => a.id === id);
  const [filter, setFilter] = useState("all");
  if (!a)
    return (
      <div className="empty">
        <h1>이 사용자에게 저장된 응시가 없습니다.</h1>
        <Link to="/records">내 기록</Link>
      </div>
    );
  const visible = a.questionIds.filter(
    (qid) =>
      filter === "all" ||
      (filter === "wrong" && a.grades[qid] === false) ||
      (filter === "pending" && a.grades[qid] === null),
  );
  return (
    <>
      <Heading
        eyebrow="RESULT & REFLECTION"
        title={a.title}
        description={`${a.expired ? "시간 만료로 제출 · " : ""}미응답은 오답. 서술 답안은 자기 평가 결과로 확정합니다.`}
      />
      <section className="result-summary glass">
        <div>
          <span>최종 점수</span>
          <strong>{a.score === null ? "평가 대기" : `${a.score}점`}</strong>
        </div>
        <div>
          <span>정답</span>
          <strong>
            {a.correct} / {a.total}
          </strong>
        </div>
        <div>
          <span>자기 평가 대기</span>
          <strong>{a.pending}문항</strong>
        </div>
        <div>
          <span>풀이 시간</span>
          <strong>
            {Math.floor(a.durationSeconds / 60)}분 {a.durationSeconds % 60}초
          </strong>
        </div>
      </section>
      <div className="actions">
        <Link className="button" to="/wrong">
          오답노트
        </Link>
        <Link className="button" to="/records">
          내 기록
        </Link>
        <Link className="button primary" to="/cbt">
          다음 연습
        </Link>
      </div>
      <div className="filters">
        <label>
          결과 보기
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            <option value="wrong">오답</option>
            <option value="pending">자기 평가 대기</option>
          </select>
        </label>
      </div>
      {visible.map((qid) => {
        const q = questionMap[qid],
          g = a.grades[qid];
        return (
          <article className="panel result-question" key={qid}>
            <div className="question-top">
              <span
                className={`tag ${g ? "correct" : g === false ? "incorrect" : ""}`}
              >
                {g === null ? "자기 평가 대기" : g ? "✓ 정답" : "× 오답"} ·{" "}
                {qid}
              </span>
              <BookmarkButton targetId={qid} kind="question" />
            </div>
            <h2>{q.stem}</h2>
            <details>
              <summary>공통 자료 다시 보기 · {caseMap[q.caseId].title}</summary>
              <Materials data={caseMap[q.caseId]} />
            </details>
            <Explanation q={q} answer={a.answers[qid] ?? ""} />
            {q.kind === "essay" && a.answers[qid]?.trim() && (
              <div className="actions">
                <button
                  aria-pressed={a.selfGrades[qid] === true}
                  onClick={() =>
                    void run(evaluateEssay(session.userId, a.id, qid, true))
                  }
                >
                  채점 요소를 충족했어요
                </button>
                <button
                  aria-pressed={a.selfGrades[qid] === false}
                  onClick={() =>
                    void run(evaluateEssay(session.userId, a.id, qid, false))
                  }
                >
                  다시 복습할게요
                </button>
              </div>
            )}
          </article>
        );
      })}
      {!visible.length && <p className="empty">이 조건의 문항이 없습니다.</p>}
    </>
  );
}
