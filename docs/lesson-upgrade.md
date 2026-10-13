# 초심자용 전체 강의 보강 · 2026-10-13

28개 강의 모두에 기초 개념과 설명 흐름을 보강했다. 본문(섹션 문단만 계산)은 14,650자에서 61,544자로 약 4.20배 늘었다. 각 강의는 6개 설명 섹션, 선수 강의 연결, 최소 7개 용어 비교, 입력·출력이 있는 독립 코드 실습, 3개 자가 점검, 핵심 정리를 갖춘다. 기존 사례 39개를 강의 안의 표·그래프·계산 풀이와 연결하고 정답뿐 아니라 선택지별 판단 근거를 보여 준다. 추가 자가 점검은 총 84개이며 기존 CBT 195문항과 별개다.

처음 배우는 사용자를 위해 정의 → 비유/예시 → 작동 과정 → 비교와 조건 → 작은 계산 → 해석 한계를 연결했다. OS는 하드웨어부터, 분석은 행·열·관찰 단위부터, 텍스트·모델은 토큰·벡터·피처·타깃부터 설명한다. 날짜 변환 실패, 겹친 결측, 작품과 관계 수, 부분 연도, 행·열 분모, 반복 엣지, 평점 상관의 관측 조건, 학습 경계와 MAE를 손으로 따라가는 설명을 포함한다.

## 공부하는 순서

1. A1부터 순서대로 읽거나 강의 상단의 선수 강의 링크로 필요한 개념을 먼저 읽는다.
2. 기초 설명 뒤 작은 사례 표에서 대상·단위·N·제외 조건을 확인한다.
3. 계산 풀이와 각 선택지의 근거를 읽고 자신의 설명을 만든다.
4. 코드 각 줄의 결과를 예상하고 실행 결과를 펼쳐 비교한다.
5. 자가 점검의 답을 가린 상태에서 설명한 뒤 정답과 이유를 확인한다.
6. 같은 자료로 CBT를 풀고 오답 연결 강의로 돌아온다. 읽기 완료는 이해 점수와 별개다.

표시 시간은 설명 읽기와 작은 자료 풀이의 대략적인 학습 시간이며 개인별 속도에 따라 달라진다. 교수자의 실제 출제 규격이나 성적을 보장하는 수치는 아니다.

## 범위와 재현

주자료 PDF 4개와 기존 실제 페이지 매핑을 유지한다. 웹사이트 PDF 3개는 동일 주제의 설명 보강만 사용한다. 신규 실제 시험 범위나 외부 데이터셋을 추가하지 않았다. [출처 지도](source-map.md), [범위 커버리지](coverage.md)에 강의별 근거가 있다. 설명·비유·예제는 직접 작성했다. 원본 PDF·추출문·사용자 기록·인증정보는 저장소에 포함하지 않는다.

기존 강의·사례·문항·선지 ID와 저장 구조를 유지한다. cases/questions/sources/topics/blueprints의 의미적 SHA-256은 이전 커밋 `d83d092`와 동일함을 검증한다. 따라서 기존 진도·오답·북마크·응시가 참조하는 대상은 유지된다. 개인 기록을 검사하거나 업로드하지 않았다.

`scripts/enrichment/`는 보강 설명과 실습의 작성 원본이다. `scripts/generate_content.py`가 이를 함께 적용하므로 재생성해도 보강이 사라지지 않는다. 코드 실습은 외부 파일 없이 동작하는 Python이며 브라우저에는 검증된 출력이 표시된다. A–D의 일부 코드는 개념 계산 모형으로, 실제 운영체제·클러스터 구현이 아니다. H3의 TF-IDF 및 H4의 Pipeline/Ridge 예제도 별도로 만든 작은 가상 입력이다.

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

## 검증 결과

- Python 3.12.14, NumPy 2.3.5, Pandas 3.0.1, scikit-learn 1.9.1: 28개 실행 가능 실습의 출력이 모두 지정 출력과 일치.
- 기존 39개 수치 정답 및 9개 변환 출력의 독립 검산 통과.
- 콘텐츠 스키마, 선수 관계의 순서/순환 방지, 사례·풀이 연결, 근거 페이지 검사 통과.
- 기존 자동 테스트 17개 및 TypeScript·Vite 빌드 통과.
- 브라우저에서 28개 강의의 6섹션·실습·3문제 렌더링을 확인. 기본 데스크톱 및 390px 모바일 전 페이지 가로 넘침 없음. 모바일 목차, 코드 출력, 키보드 답 펼치기, 선수 링크, 추가 표, 라이트/다크 확인.
- 모바일 HDFS 검증 메모의 긴 URL이 넘치는 문제를 발견해 줄바꿈으로 수정하고 재확인.

검사 데이터는 [자동 검증](lesson-validation.json), [브라우저 검증](lesson-browser-validation.json), [기능 검증](functional-tests.md)에 있다. 브라우저 전수 점검은 구조·렌더링 검사이며 모든 문장을 교육 전문가가 검토했다는 의미는 아니다.

## 강의별 변화

본문 자수는 코드·표·풀이·자가 점검을 제외한 섹션 문단만 센다.

| 강의 | 제목 | 본문 이전 → 보강 | 섹션 | 연결 풀이 | 추가 자가 점검 | 코드 출력 |
|---|---|---:|---:|---:|---:|---|
| A1 | 소프트웨어 스택과 OS의 역할 | 557 → 2433 | 6 | 1 | 3 | PASS |
| A2 | 프로그램, 프로세스, PCB와 시분할 | 490 → 2368 | 6 | 1 | 3 | PASS |
| A3 | 메모리 관리와 가상 메모리 | 536 → 2393 | 6 | 1 | 3 | PASS |
| A4 | 파일·디렉터리·블록·빈 공간 | 513 → 2385 | 6 | 1 | 3 | PASS |
| A5 | Linux·오픈소스·배포판 | 539 → 2515 | 6 | 1 | 3 | PASS |
| B1 | 빅데이터 정의와 5V | 488 → 2179 | 6 | 1 | 3 | PASS |
| B2 | 활용 사례와 발전 과정 | 549 → 2194 | 6 | 1 | 3 | PASS |
| B3 | 정형·반정형·비정형, 시계열·공간 | 480 → 2129 | 6 | 1 | 3 | PASS |
| C1 | 분산 인프라·클라우드·엣지 | 541 → 2229 | 6 | 1 | 3 | PASS |
| C2 | 크롤링·API·센서·ETL/ELT | 583 → 2276 | 6 | 1 | 3 | PASS |
| C3 | 스트리밍·윈도우·중복 처리 | 471 → 2121 | 6 | 1 | 3 | PASS |
| C4 | HDFS: 블록, 복제, 메타데이터 | 550 → 2236 | 6 | 1 | 3 | PASS |
| C5 | NoSQL 모델·오브젝트 스토리지·레이크 | 521 → 2192 | 6 | 1 | 3 | PASS |
| D1 | 정제: 결측·중복·이상값·표준화 | 493 → 2147 | 6 | 1 | 3 | PASS |
| D2 | 프로파일링·검증 규칙·메타데이터 | 519 → 2084 | 6 | 1 | 3 | PASS |
| D3 | 거버넌스·프라이버시·접근 제어 | 578 → 2162 | 6 | 1 | 3 | PASS |
| E1 | 분석 질문, 데이터 사전과 프로세스 | 542 → 2201 | 6 | 1 | 3 | PASS |
| E2 | 분석 환경·원본 보존·재현성 | 515 → 2161 | 6 | 1 | 3 | PASS |
| F1 | 넷플릭스 결측 처리와 유효 N | 527 → 2135 | 6 | 2 | 3 | PASS |
| F2 | 문자열·날짜·분과 시즌 변환 | 529 → 2147 | 6 | 1 | 3 | PASS |
| F3 | describe·집계·explode·교차표 | 595 → 2205 | 6 | 3 | 3 | PASS |
| G1 | 막대·히스토그램·박스플롯 | 497 → 1995 | 6 | 3 | 3 | PASS |
| G2 | 등록 추이·산점도·이중 축 | 462 → 1946 | 6 | 3 | 3 | PASS |
| G3 | 교차표·히트맵·분모 비교 | 447 → 2007 | 6 | 3 | 3 | PASS |
| H1 | 감독·배우 네트워크와 중심성 | 486 → 2055 | 6 | 1 | 3 | PASS |
| H2 | 텍스트 전처리와 워드클라우드 | 469 → 1956 | 6 | 1 | 3 | PASS |
| H3 | TF-IDF·콘텐츠 추천·협업 필터링 | 589 → 2379 | 6 | 2 | 3 | PASS |
| H4 | 회귀·Ridge·학습/테스트·MAE | 584 → 2314 | 6 | 2 | 3 | PASS |

## 기술 설명 확인에 사용한 공식 자료

아래는 교재의 기술 설명을 확인하는 자료이며 별도의 시험 범위가 아니다.

- 결측 처리와 반환 형식: [Pandas missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
- 목록 펼치기와 교차표: [Pandas reshaping](https://pandas.pydata.org/docs/user_guide/reshaping.html), [crosstab](https://pandas.pydata.org/docs/reference/api/pandas.crosstab.html)
- 파티션 순서의 범위: [Apache Kafka 소개](https://kafka.apache.org/documentation/)
- GNU의 실행·연구·수정·배포 자유: [GNU 자유 소프트웨어 정의](https://www.gnu.org/philosophy/free-sw.en.html)
- TF-IDF 기본 가중치: [TfidfTransformer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfTransformer.html)
- 내적과 벡터 길이로 계산하는 유사도: [cosine_similarity](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html)
- L2 규제 회귀: [Ridge](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Ridge.html)
- 학습·테스트 경계와 전처리 누수: [scikit-learn common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)

원문 오류와 추가 확인 내용은 [content-issues.md](content-issues.md)에 별도로 기록했다.
