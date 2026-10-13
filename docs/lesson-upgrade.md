# 노션 수업 중심 강의 개편 · 2026-10-13

28개 강의를 주자료의 개념·비교·코드·자료 해석 중심으로 다시 정리했다. 컴퓨터 입문을 위한 별도 설명을 줄이고 각 강의를 4개 설명 섹션으로 구성한다. 39개 단계별 사례 풀이와 84개 자가 점검, 핵심 정리와 필요한 선수 강의 연결을 유지한다. 이전의 6섹션·28개 추가 실행 예제 구성은 교체했다.

## 범위와 학습 순서

개요 자료, 2주차 노션, 3주차 노션, 넷플릭스 노션 전체를 범위로 삼는다. 넷플릭스의 네트워크·텍스트·추천·회귀까지 포함한다. 학기 계획의 주차만으로 넷플릭스 심화를 제외하지 않는다. 웹사이트 PDF 3개는 같은 주제의 설명 보강만 사용한다. Titanic과 후반 학기 로드맵은 추가하지 않았다. PDF에 구체적 절차가 없는 Hadoop 설치·MapReduce 실습은 새 강의로 만들어 넣지 않는다.

강의의 핵심·목표 → 개념·비교 → 코드·도식 해석 → 단계별 사례 → 자가 점검 → 종합 회차 → 오답 연결 강의 순서로 공부한다. 사례 풀이에서 분모·단위·제외 조건과 해석 한계를 확인한다. 읽기 완료는 이해 점수와 별개다.

Python 입출력 실습은 E2/F1/F2/F3/H3/H4의 6개다. 수업 코드를 확인하는 작은 가상 입력이며 외부 CSV 없이 실행된다. H4는 TF-IDF의 fit_transform/transform과 Ridge의 fit/predict를 명시적으로 보여 준다. A~D의 실행 흉내 예제는 개념 도식·흐름으로 교체한다. 원본 PDF·추출문·개인 기록·인증정보는 저장소에 포함하지 않는다.

[실제 페이지 출처](source-map.md), [커버리지](coverage.md), [원문 오류 검토](content-issues.md)를 함께 확인한다.

## 종합 회차

CBT와 모의고사는 같은 고정 세트를 연습/시험 모드로 제공한다. 단원 필터 대신 1~5회차 중 하나를 선택한다. 각 회차는 A~H 전 범위의 50문항·10개 공통 자료이며 같은 사례의 5문항이 연속해서 나온다. 연습은 문항별 확인, 시험은 제출 후 해설을 공개한다. 기본 75분은 조절 가능한 학습용 설정이며 실제 시험 규격은 미확정이다.

| 회차 | 고정 사례 순서 | 문항 |
|---|---|---:|
| 종합모의고사 1회차 | C24, C10, C05, C18, C32, C01, C12, C15, C34, C27 | 50 |
| 종합모의고사 2회차 | C19, C02, C13, C35, C06, C08, C16, C23, C36, C28 | 50 |
| 종합모의고사 3회차 | C21, C09, C03, C14, C17, C33, C39, C15, C29, C37 | 50 |
| 종합모의고사 4회차 | C30, C04, C07, C20, C38, C12, C16, C26, C05, C34 | 50 |
| 종합모의고사 5회차 | C11, C22, C25, C31, C38, C06, C13, C16, C32, C36 | 50 |

5회차 전체에 39개 사례·195개 고유 문항이 포함된다. 일부 사례는 회차 간 반복되지만 한 회차 안에 중복 문항은 없다. 250개 고유 문항이라는 의미는 아니다. 강의·자료·오답·북마크의 개별 복습은 `/practice`로 연결한다.

## 재현과 검증

`scripts/enrichment/course_focus.py`에 설명 선택·도식·회차 배분을 관리한다. `scripts/generate_content.py`가 이를 적용하므로 재생성해도 개편이 유지된다. 기존 강의·사례·문항·선지 ID와 저장 구조를 유지한다. cases/questions/sources/topics의 의미적 SHA-256은 기존 기준 커밋과 동일하다. blueprints는 종합 구성으로 변경했으며 기존 첫 3개 회차 ID를 유지하고 2개를 추가했다.

```sh
python -m pip install -r scripts/requirements-lessons.txt
python scripts/generate_content.py
python scripts/verify_lessons.py
python scripts/verify_answers.py
python scripts/document_content.py
python scripts/document_lessons.py
npm run validate
npm test
npm run build
```

- 6개 코드 출력, 39개 수치 정답·9개 변환 출력 독립 검산 통과.
- 출처·스키마·선수 관계·풀이 연결 검사 통과.
- 5회차의 중복 방지·사례 연속·A~H 포함·전체 195문항 커버리지 검사 통과.
- 자동 테스트 18개와 TypeScript·Vite 빌드 통과.
- [자동 검산 데이터](lesson-validation.json), [브라우저 구조 검사](lesson-browser-validation.json), [기능 검증](functional-tests.md).

## 강의별 구성

본문 자수는 코드·표·풀이·자가 점검을 제외한 섹션 문단만 센다. NOT_APPLICABLE은 실행 예제가 없는 개념·자료 해석 강의다.

| 강의 | 제목 | 본문 자수 | 섹션 | 사례 풀이 | 자가 점검 | Python 출력 |
|---|---|---:|---:|---:|---:|---|
| A1 | 소프트웨어 스택과 OS의 역할 | 1510 | 4 | 1 | 3 | NOT_APPLICABLE |
| A2 | 프로그램, 프로세스, PCB와 시분할 | 1457 | 4 | 1 | 3 | NOT_APPLICABLE |
| A3 | 메모리 관리와 가상 메모리 | 1473 | 4 | 1 | 3 | NOT_APPLICABLE |
| A4 | 파일·디렉터리·블록·빈 공간 | 1468 | 4 | 1 | 3 | NOT_APPLICABLE |
| A5 | Linux·오픈소스·배포판 | 1375 | 4 | 1 | 3 | NOT_APPLICABLE |
| B1 | 빅데이터 정의와 5V | 1319 | 4 | 1 | 3 | NOT_APPLICABLE |
| B2 | 활용 사례와 발전 과정 | 1358 | 4 | 1 | 3 | NOT_APPLICABLE |
| B3 | 정형·반정형·비정형, 시계열·공간 | 1337 | 4 | 1 | 3 | NOT_APPLICABLE |
| C1 | 분산 인프라·클라우드·엣지 | 1372 | 4 | 1 | 3 | NOT_APPLICABLE |
| C2 | 크롤링·API·센서·ETL/ELT | 1439 | 4 | 1 | 3 | NOT_APPLICABLE |
| C3 | 스트리밍·윈도우·중복 처리 | 1320 | 4 | 1 | 3 | NOT_APPLICABLE |
| C4 | HDFS: 블록, 복제, 메타데이터 | 1406 | 4 | 1 | 3 | NOT_APPLICABLE |
| C5 | NoSQL 모델·오브젝트 스토리지·레이크 | 1377 | 4 | 1 | 3 | NOT_APPLICABLE |
| D1 | 정제: 결측·중복·이상값·표준화 | 1294 | 4 | 1 | 3 | NOT_APPLICABLE |
| D2 | 프로파일링·검증 규칙·메타데이터 | 1295 | 4 | 1 | 3 | NOT_APPLICABLE |
| D3 | 거버넌스·프라이버시·접근 제어 | 1388 | 4 | 1 | 3 | NOT_APPLICABLE |
| E1 | 분석 질문, 데이터 사전과 프로세스 | 1408 | 4 | 1 | 3 | NOT_APPLICABLE |
| E2 | 분석 환경·원본 보존·재현성 | 1323 | 4 | 1 | 3 | PASS |
| F1 | 넷플릭스 결측 처리와 유효 N | 1303 | 4 | 2 | 3 | PASS |
| F2 | 문자열·날짜·분과 시즌 변환 | 1336 | 4 | 1 | 3 | PASS |
| F3 | describe·집계·explode·교차표 | 1369 | 4 | 3 | 3 | PASS |
| G1 | 막대·히스토그램·박스플롯 | 1227 | 4 | 3 | 3 | NOT_APPLICABLE |
| G2 | 등록 추이·산점도·이중 축 | 1158 | 4 | 3 | 3 | NOT_APPLICABLE |
| G3 | 교차표·히트맵·분모 비교 | 1272 | 4 | 3 | 3 | NOT_APPLICABLE |
| H1 | 감독·배우 네트워크와 중심성 | 1257 | 4 | 1 | 3 | NOT_APPLICABLE |
| H2 | 텍스트 전처리와 워드클라우드 | 1182 | 4 | 1 | 3 | NOT_APPLICABLE |
| H3 | TF-IDF·콘텐츠 추천·협업 필터링 | 1504 | 4 | 2 | 3 | PASS |
| H4 | 회귀·Ridge·학습/테스트·MAE | 1458 | 4 | 2 | 3 | PASS |
