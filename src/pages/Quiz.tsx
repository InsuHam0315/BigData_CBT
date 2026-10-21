import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  ListOrdered,
  Timer,
} from "lucide-react";
import { BookmarkButton, Heading, kindLabel } from "../components/UI";
import { useStudy } from "../context";
import {
  caseMap,
  allBlueprints as blueprints,
  isFinalQuestion,
  isCourseQuestion,
  allCases as cases,
  lessonMap,
  questionMap,
  allTopics as topics,
} from "../content";
import type { Attempt, Question, ExamDraft } from "../types";
import {questionSection, roundStartPath} from "../assessment";
import { grade, topicStats } from "../engine";
import {
  evaluateEssay,
  patchDraft,
  submitDraft,
} from "../storage";
import { Materials, Sources } from "../components/Materials";
import {SourceFigure} from '../components/SourceFigure';
import {TeacherBadge} from '../components/ChapterSummary';
import {QuestionExhibit} from '../components/QuestionExhibit';
const isCompactQuestion=(id:string)=>isFinalQuestion(id)||isCourseQuestion(id);
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
export function Explanation({ q, answer, result }: { q: Question; answer?: string; result?: boolean | null }) {
  const verdict = result === undefined && answer !== undefined ? grade(q, answer) : result;
  const additionalSteps = q.steps.filter(step=>!q.explanation.includes(step));
  return (
    <div className={`explanation ${verdict === false ? 'is-incorrect' : ''}`}>
      <span className="eyebrow">WHY THIS ANSWER</span>
      <h3>정답 · {correctText(q)}</h3>
      {answer !== undefined && <p className={`explanation-answer ${verdict === false ? 'incorrect' : verdict === true ? 'correct' : ''}`}>{verdict === false ? '× 내 답 (오답)' : verdict === true ? '✓ 내 답 (정답)' : '내 답'}: {answerText(q, answer)}</p>}
      <p>{q.explanation}</p>
      {!!q.figureIds?.length&&<details className="explanation-source"><summary>원본 차트 읽는 법</summary>{q.figureIds.map(id=><SourceFigure key={id} id={id}/>)}</details>}
      {!!additionalSteps.length && <ol>
        {additionalSteps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>}
      {q.choices && !isFinalQuestion(q.id) && (
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
      <Link className="button" to={q.documentId?`/notebook/${q.documentId}?chapter=${q.notebookChapterId}`:`/lessons/${q.lessonId}`}>
        연결 강의 · {lessonMap[q.lessonId].title}
        <ArrowRight size={14} />
      </Link>
      <Sources refs={q.sources} />
    </div>
  );
}
export function Quiz() {
  const { profile, session, run } = useStudy(),
    navigate = useNavigate(),
    draft = profile.draft;
  const [now, setNow] = useState(Date.now()),
    [mobileView, setMobileView] = useState<"question" | "data">("question"),
    [paletteOpen, setPaletteOpen] = useState(false);
  const submitting = useRef(false);
  const questionHeading=useRef<HTMLHeadingElement>(null);
  const paletteToggle=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!draft)return;
    setMobileView('question');
    setPaletteOpen(false);
    const frame=requestAnimationFrame(()=>{questionHeading.current?.focus({preventScroll:true});questionHeading.current?.scrollIntoView({block:'start'});});
    return()=>cancelAnimationFrame(frame);
  },[draft?.id,draft?.index]);
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
    checked = draft.checked.includes(q.id),
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
              ? "EXAM MODE · 문항별 답안 확인 가능"
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
      <div className="mobile-quiz-tabs" hidden={isCompactQuestion(q.id)}>
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
      <div className="quiz-workspace" onKeyDown={e=>{
        if(e.key==='Escape'&&paletteOpen){setPaletteOpen(false);paletteToggle.current?.focus();}
      }}>
        <nav className="quiz-navigation" aria-label="문제 이동">
          <button disabled={draft.index===0} onClick={()=>patch(d=>{d.index--;})}><ArrowLeft size={16}/>이전</button>
          <strong aria-live="polite">{draft.index+1} / {draft.questionIds.length}</strong>
          <button disabled={draft.index===draft.questionIds.length-1} onClick={()=>patch(d=>{d.index++;})}>다음<ArrowRight size={16}/></button>
          <button ref={paletteToggle} className="palette-toggle" aria-label="문제 번호" aria-expanded={paletteOpen} aria-controls="question-palette" onClick={()=>setPaletteOpen(v=>!v)}><ListOrdered size={16}/>번호</button>
        </nav>
        <aside id="question-palette" className={`panel palette-panel ${paletteOpen?'is-open':''}`} aria-label="문제 번호 이동">
          <h3>문제 번호</h3>
          <div className="palette">
            {draft.questionIds.map((id,i)=>{
              const verdict=draft.checked.includes(id)?grade(questionMap[id],draft.answers[id],draft.selfGrades[id]):null;
              const status=verdict===false?'오답':verdict===true?'정답':draft.answers[id]?.trim()?'응답':'미응답';
              return <button key={id} aria-label={`${i+1}번 ${status}${draft.reviewed.includes(id)?' 검토':''}`} aria-current={draft.index===i?'step':undefined}
                className={`${draft.answers[id]?.trim()?'answered':''} ${verdict===false?'is-incorrect':verdict===true?'is-correct':''} ${draft.reviewed.includes(id)?'reviewed':''} ${i===draft.index?'current':''}`}
                onClick={()=>{setPaletteOpen(false);if(i===draft.index)requestAnimationFrame(()=>{questionHeading.current?.focus({preventScroll:true});questionHeading.current?.scrollIntoView({block:'start'});});patch(d=>{d.index=i;});}}>
                {i+1}{verdict!==null&&<span className="palette-verdict" aria-hidden="true">{verdict?'✓':'×'}</span>}{draft.reviewed.includes(id)&&<Flag size={9}/>}
              </button>;
            })}
          </div>
          <p className="muted palette-legend">빈 칸=미응답 · 채움=응답<br/><span className="correct">✓ 정답</span> · <span className="incorrect">× 오답</span> · ⚑ 검토 · 테두리=현재</p>
          <button className="primary submit" disabled={submitting.current} onClick={()=>void finish(false)}>전체 제출 · 미응답 {draft.questionIds.length-answered}개</button>
        </aside>
        <div className={`quiz-layout ${isCompactQuestion(q.id) ? "final-quiz-layout" : ""}`}>
        <div
          hidden={isCompactQuestion(q.id)}
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
              {!!q.highlightIds?.length&&<TeacherBadge/>}
            </div>
            <h2 ref={questionHeading} tabIndex={-1} className="question-heading">{q.stem}</h2>
            {/^F\d{2}Q\d{2}$/.test(q.id)&&<div className="notice"><p>개정 전 문제입니다. 저장된 답안을 위해 당시 내용을 유지합니다.</p><Link className="button" to="/cbt">개념 적용판 새 회차 선택 →</Link></div>}
            {/^C26R\d{2}Q\d{2}$/.test(q.id)&&<div className="notice"><p>PDF 4개 범위의 개정 전 문제입니다. 저장된 답안과 오답 기록을 위해 당시 내용을 유지합니다.</p><Link className="button" to="/mock">개념 적용 개정판 · 새 회차 선택 →</Link></div>}
            <QuestionExhibit q={q}/>
            {q.figureIds?.map(id=><SourceFigure key={id} id={id} mode="question"/>)}
            {q.kind === "choice" ? (
              <fieldset className="choices">
                <legend className="sr-only">정답 선택</legend>
                {order.map((id, i) => {
                  const choice = q.choices!.find((c) => c.id === id)!;
                  return (
                    <label
                      key={id}
                      className={`choice ${answer === id ? "selected" : ""} ${checked && id===q.correctId?'choice-correct':''} ${checked && answer===id && result===false?'choice-incorrect':''}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={id}
                        checked={answer === id}
                        onChange={() => setAnswer(id)}
                      />
                      <span className="choice-number">{i + 1}</span>
                      <span className="choice-text">{choice.text}</span>
                      {checked && (id===q.correctId || answer===id) && <span className="choice-verdict">{id===q.correctId?'✓ 정답':'× 내 오답'}</span>}
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <label className={`answer-input ${result===false?'answer-incorrect':''}`}>
                {q.kind === "numeric"
                  ? `${q.numeric!.unit} · ${q.numeric!.rounding} · 허용 오차 ±${q.numeric!.tolerance}`
                  : q.kind === "essay"
                    ? "근거와 해석 한계를 2~4문장으로 적어 보세요."
                    : "지정된 용어로 짧게 입력하세요."}
                {q.kind === "essay" ? (
                  <textarea
                    aria-label="서술 답안"
                    aria-invalid={result===false || undefined}
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
                    aria-invalid={result===false || undefined}
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
            </div>
            {checked && (
              <>
                <p
                  className={`grade-status ${result === true ? "correct" : result === false ? "incorrect" : ""}`}
                  role="status"
                >
                  {result === null
                    ? "서술 답안 · 자기 평가 대기"
                    : result
                      ? "✓ 정답"
                      : "× 오답"}
                </p>
                <Explanation q={q} answer={answer} result={result} />
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
          </section>
        </div>
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
  const stats = topicStats([a]);
  const round = blueprints.find(b => b.questionIds?.length === a.questionIds.length && a.questionIds.every(id => b.questionIds!.includes(id))) ?? blueprints.find(b => a.title.startsWith(b.title));
  const section = questionSection(a.questionIds) ?? (a.mode === "exam" ? "mock" : "cbt");
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
        <Link className="button primary" to={`/${section}`}>
          {section === "cbt" ? "1~3장 CBT 회차 선택" : "필기본 4개 모의고사 회차 선택"}
        </Link>
        {round && <Link className="button" to={roundStartPath(round.id, section)}>같은 회차 다시 풀기</Link>}
      </div>
      <section className="panel"><h2>이번 응시의 주제별 결과</h2>{topics.filter(t=>stats[t.id]).map((t) => <div className="weakness-row" key={t.id}><span>{t.title}</span>{stats[t.id] ? <><b>{stats[t.id].correct}/{stats[t.id].total} 정답</b><Link to={`/lessons?topic=${t.id}`}>강의 복습 →</Link></> : <small>채점된 응답 없음</small>}</div>)}<p className="muted">자기 평가 대기 응답은 평가를 마친 뒤 포함됩니다.</p></section>
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
          <article className={`panel result-question ${g===false?'result-incorrect':''}`} key={qid}>
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
            <QuestionExhibit q={q}/>
            {!isCompactQuestion(q.id) && <details>
              <summary>공통 자료 다시 보기 · {caseMap[q.caseId].title}</summary>
              <Materials data={caseMap[q.caseId]} />
            </details>}
            <Explanation q={q} answer={a.answers[qid] ?? ""} result={g} />
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
