# 정답·코드 출력 검증

실행일: 2026-10-12. Python 3.12.14, Pandas 3.0.1, NumPy 2.3.5.

`python scripts/verify_answers.py`는 앱의 calculation 구현을 호출하지 않고, 공개된 합성 사례 표를 Pandas/NumPy의 독립적인 식으로 검산한다. 숫자 정답 39개 모두 PASS. `npm run validate`는 앱 계산 규칙과 정답도 별도로 비교한다.

| 문항 | 계산값 | 단위 | 결과 |
|---|---:|---|---|
| C01-Q3 | 10 | ms | PASS |
| C02-Q2 | 4 | ms | PASS |
| C03-Q2 | 3 | GiB | PASS |
| C04-Q1 | 24 | KiB | PASS |
| C05-Q1 | 12000 | 건 | PASS |
| C06-Q2 | 3 | 개 | PASS |
| C07-Q2 | 84 | ms | PASS |
| C08-Q2 | 5 | 건 | PASS |
| C09-Q1 | 3 | 개 | PASS |
| C10-Q1 | 5 | 블록 | PASS |
| C11-Q2 | 16 | 천건/초 | PASS |
| C12-Q1 | 4 | 행 | PASS |
| C13-Q1 | 2 | 행 | PASS |
| C14-Q1 | 6 | 명 | PASS |
| C15-Q2 | 6 | 개 | PASS |
| C16-Q1 | 9 | 행 | PASS |
| C17-Q1 | 5 | 개 | PASS |
| C18-Q1 | 2 | 행 | PASS |
| C19-Q1 | 2 | 시즌 | PASS |
| C20-Q1 | 8 | 행 | PASS |
| C21-Q1 | 7 | 행 | PASS |
| C22-Q1 | 5 | 관계 | PASS |
| C23-Q1 | 4.5 | 년 | PASS |
| C24-Q1 | 60 | % | PASS |
| C25-Q1 | 20 | 개 | PASS |
| C26-Q1 | 100 | 분 | PASS |
| C27-Q1 | 15 | 개/월 | PASS |
| C28-Q1 | 10 | 개 | PASS |
| C29-Q1 | 60 | % | PASS |
| C30-Q1 | 75 | % | PASS |
| C31-Q1 | 27 | 십억 달러 | PASS |
| C32-Q1 | 0.75 | 중심성 | PASS |
| C33-Q1 | 24 | 토큰 | PASS |
| C34-Q1 | 0.6 | 유사도 | PASS |
| C35-Q1 | 3 | 명 | PASS |
| C36-Q1 | 1.5 | 년 | PASS |
| C37-Q1 | 20 | % | PASS |
| C38-Q1 | 10 | 개 | PASS |
| C39-Q1 | 5 | 단계 | PASS |

| 자료 | 실행한 연산 | 확인 출력 |
|---|---|---|
| C18 | fillna + dropna | a,b,e 3행 / 알려진 감독 2행 |
| C20 | split + explode + value_counts | 8관계 / 4작품 / Drama 3,Comedy 3,Action 2 |
| C21 | country·listed_in 순차 explode | 7 국가×장르 관계 |
| C26 | NumPy linear quantile | Q1 85 / 중앙값 100 / Q3 115 / IQR 30 |
| C32 | 고유 엣지·이웃 집합 | 레코드 5 / 엣지 4 / 노드 5 / D1 중심성 0.75 |
| C34 | 후보 필터 + 안정적 동점 정렬 | B,C,D |
| C35 | Pandas corr(min_periods=2) | A-B 1 / A-C -1 / 신규 NaN |
| 원문 p60~62 | 9평점 pivot + corr | Matrix 상수, Inception 1관측 → Pearson NaN |
| C36 | NumPy absolute error mean | MAE 1.5년 |

원본 CSV는 다운로드하거나 실행하지 않았다. 실제 넷플릭스 카탈로그의 통계 재현을 주장하지 않는다. 모든 사례 수치는 학습용 가상 데이터이며 원문은 개념 범위와 해석 주의점의 근거다.

117개 객관식은 정답 ID 1개와 4개 선지·각 이유를 구조 검사하고 사례 해설과 수작업으로 대조했다. 인프라·보안·인과 해석 같은 문장의 진위를 수치 테스트만으로 증명하지는 않는다. 15개 짧은 답은 지정 용어의 허용 목록, 24개 서술은 공개한 모범 답안·채점 요소로 자기 평가한다. 서술 문장을 외부 AI로 자동 채점하지 않는다.

오해 점검: 부분 연도( C27), 집단별 분모(C29/C30), 관계 행≠작품(C20/C21/C22), 시청 등급≠사용자 평점(C15/C35), 카탈로그≠인기(C24), 이중 축≠투자 효과(C31), 극단값≠오류(C26), 빈도≠감정(C33), 누수 없는 train fit/test transform(C37).
