# 구조·저장 계약

| 계층 | 파일 | 책임 |
|---|---|---|
| 범위/콘텐츠 | `src/types.ts`, `src/content/` | Source/Topic/Lesson/CaseStudy/Question/ExamBlueprint. 개념 근거와 가상 수치 출처 분리 |
| 계산/채점 | `src/engine.ts` | 표 기반 계산, 정답 ID, 오차, 용어 정규화, 서술 대기, 사례 묶음 추출, 초안 생성 |
| 저장/인증 | `src/storage.ts` | LocalUser/Session/Attempt/ExamDraft/WrongNote/LessonProgress/Bookmark/Profile, PBKDF2, IndexedDB 트랜잭션, 백업 스키마 |
| 세션/상태 | `src/context.tsx`, `src/study-context.ts` | 탭 소유자, 비동기 완료 시 소유자 재검사, BroadcastChannel 새로 읽기, 테마 |
| 화면 | `src/App.tsx`, `src/pages/`, `src/components/` | HashRouter, 강의/읽기/풀이/결과/오답/계정, 표·SVG·접근 가능한 확대 |
| 검증 | `scripts/validate.ts`, `scripts/verify_answers.py`, `tests/` | ID/근거/범위/정답/분배, 독립 수치·Pandas 출력, 소유자·원자성·채점 |

`profiles` 저장소의 키는 `userId`이고 소유자의 기록 전체를 하나의 트랜잭션에서 읽고 수정한다. 트랜잭션 안에는 await를 넣지 않아 여러 탭의 동시 쓰기가 최신 값을 기준으로 직렬화된다. `users`는 안정적인 UUID 키와 유일한 소문자 로그인 ID 인덱스를 가진다. 게스트 키는 회원 UUID와 별도다.

저장 API는 명시적인 소유자를 받는다. 풀이 수정과 제출은 시작한 draft.userId를 사용하고, Context는 완료 시 현재 소유자와 반환 프로필 소유자가 모두 일치할 때만 화면/후속 이동을 반영한다. 다른 사용자의 변경 알림은 화면에 적용하지 않는다. draft ID가 바뀌면 오래된 콜백은 새 초안을 수정하지 못한다. 제출 기록 ID는 draft ID와 같아 반복 제출에서 중복 저장되지 않는다.

백업은 strict Zod 스키마, 버전 1, 크기/배열/답안 길이 제한, 실제 콘텐츠 ID, 중복 키, 선지 순서, 인덱스·시험 종료 시각을 검사한다. 응시 점수는 가져온 값을 신뢰하지 않고 현재 정답과 답안에서 재계산한다. 표시 문자열은 React 텍스트 노드로 렌더링하며 임의 HTML을 실행하지 않는다. 인증 레코드는 백업 스키마에 포함되지 않는다.

자료 표/차트/해설은 case ID로 같은 콘텐츠를 읽는다. 숫자 규칙은 조건 필터·집계·셀/행 합·비율·단위 배수·고유/공통 관측·블록·중심성·MAE를 지원하며 정답을 숫자 상수만으로 재현하지 않는다. 별도 Pandas 식이 원시 문자열의 split/explode와 집계 표의 수치 일관성도 검산한다.

기술 검증 기준: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [PBKDF2 deriveBits](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits). 네트워크 요청으로 비밀번호·학습 기록을 전송하는 코드가 없으며 폰트도 로컬 시스템 폰트를 사용한다.
