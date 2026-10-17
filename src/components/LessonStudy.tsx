import { Link } from "react-router-dom";
import type { Lesson } from "../types";
import { caseMap, lessonMap, questionMap } from "../content";
import { Code, Materials } from "./Materials";

export function LessonPrimer({ lesson }: { lesson: Lesson }) {
  return (
    <section id={`${lesson.id}-start`} className="lesson-primer">
      <span className="eyebrow">사이트 작성 · 학습 안내</span>
      <h3>이 단원의 핵심</h3>
      <p>{lesson.intro}</p>
      {lesson.prerequisiteIds.length ? (
        <>
          <h3>함께 볼 단원</h3>
          <div className="prerequisite-links">
            {lesson.prerequisiteIds.map((id) => (
              <Link key={id} to={`/lessons/${id}`}>
                <span className="tag">{id}</span>{lessonMap[id].title}
              </Link>
            ))}
          </div>
        </>
      ) : null}
      <p className="study-route">수업 개념·비교 → 코드·도식 해석 → 사례 풀이 → 자가 점검 → 종합 회차 연습</p>
    </section>
  );
}

export function WorkedExamples({ lesson }: { lesson: Lesson }) {
  return (
    <section id={`${lesson.id}-worked`}>
      <span className="eyebrow">WORKED EXAMPLES</span>
      <span className="content-label synthetic-label">학습용 가상 사례</span>
      <h3>표·그래프를 함께 읽는 풀이</h3>
      {lesson.walkthrough.map((p, i) => <p key={i}>{p}</p>)}
      {lesson.workedExamples.map((example, i) => {
        const data = caseMap[example.caseId];
        const calc = questionMap[example.calculationId];
        const concept = questionMap[example.conceptId];
        return (
          <details key={data.id} className="worked-example" open={i === 0}>
            <summary>{data.id} · {data.title} · 풀이 펼치기</summary>
            <Materials data={data} interactive={false} />
            <div className="worked-solution">
              <h3>계산을 시작하기 전에</h3>
              <p>원본 표의 한 행: <strong>{data.unit}</strong> · 원본 N={data.validN}. 아래 계산은 각 문제에 제시된 조건을 적용합니다.</p>
              <h3>{calc.stem}</h3>
              <ol>{calc.steps.map((step, n) => <li key={n}>{step}</li>)}</ol>
              <p className="answer-line">답: {calc.numeric?.value} {calc.numeric?.unit}</p>
              <p>{calc.explanation}</p>
              <h3>선택지의 근거까지 읽기</h3>
              <p>{concept.stem}</p>
              <ul className="choice-reasons">
                {concept.choices?.map((choice) => (
                  <li key={choice.id}>
                    <strong>{choice.id === concept.correctId ? "✓ 정답" : "다른 보기"} · {choice.text}</strong>
                    <p>{choice.reason}</p>
                  </li>
                ))}
              </ul>
              <p className="notice">주의: {calc.commonError} {concept.commonError}</p>
              <Link className="button" to={`/practice?case=${data.id}`}>이 자료 확인 문제 →</Link>
            </div>
          </details>
        );
      })}
    </section>
  );
}

export function LessonLab({ lesson }: { lesson: Lesson }) {
  if (!lesson.microLab) return null;
  return (
    <section id={`${lesson.id}-lab`}>
      <span className="eyebrow">INPUT → OUTPUT</span>
      <span className="content-label synthetic-label">학습용 가상 입력 · 사이트 재구성</span>
      <h3>재구성한 코드의 출력 확인</h3>
      <p>{lesson.microLab.kind} · 노션에 나온 연산을 작은 가상 입력으로 재구성했습니다. 출력은 Python에서 실행해 확인했습니다.</p>
      <p className="muted">먼저 각 변수와 연산 뒤에 남는 값을 예상한 뒤 출력과 비교하세요.</p>
      <Code code={lesson.microLab.code} notes={lesson.microLab.notes} />
      <details className="lab-output">
        <summary>실행 결과 확인</summary>
        <pre tabIndex={0} aria-label={`${lesson.id} 코드 실행 결과`}><code>{lesson.microLab.output}</code></pre>
      </details>
    </section>
  );
}

export function LessonSelfChecks({ lesson }: { lesson: Lesson }) {
  return (
    <section id={`${lesson.id}-self-checks`}>
      <span className="eyebrow">RECALL & EXPLAIN</span>
      <span className="content-label">사이트 작성 · 자가 점검</span>
      <h3>답을 가리고 자가 점검</h3>
      <p>자신의 말로 답한 뒤 정답과 이유를 펼쳐 비교하세요. 이해가 어려운 항목은 위 설명과 풀이를 다시 읽고 사례형 CBT로 확인합니다.</p>
      {lesson.selfChecks.map((item, i) => (
        <div key={item.question} className="self-check-item">
          <h3>{i + 1}. {item.question}</h3>
          <details>
            <summary>정답과 이유 보기 · {i + 1}번</summary>
            <p className="answer-line">{item.answer}</p>
            <p>{item.explanation}</p>
          </details>
        </div>
      ))}
    </section>
  );
}

export function LessonSummary({ lesson }: { lesson: Lesson }) {
  return (
    <section id={`${lesson.id}-summary`} className="lesson-summary">
      <h3>이 단원에서 설명할 수 있어야 하는 것</h3>
      <ul>{lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
      <p>정의를 말하고, 작은 예제에 적용하고, 결과의 한계를 설명할 수 있으면 다음 단원으로 이어가세요.</p>
    </section>
  );
}
