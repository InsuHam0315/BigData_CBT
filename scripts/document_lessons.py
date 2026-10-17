"""Document the source-focused course and fixed comprehensive rounds."""
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
read = lambda p: json.loads((root / p).read_text(encoding='utf-8'))
lessons = read('src/content/lessons.json')
rounds = read('src/content/blueprints.json')
report = read('docs/lesson-validation.json')
rows = {r['id']: r for r in report['lessons']}
doc = '''# 원자료 대조와 강의 개편 · 2026-10-18

주자료 4개 172페이지를 다시 대조해 원자료 기반 설명 129개를 작성했다. 설명마다 PDF 실제 페이지를 표시한다. 내용 페이지 158개와 표지·목차·끝인사·빈 페이지 14개를 구별하고 원자료의 실습 질문과 그림·코드 흐름까지 다룬다. 기존 28개 단원은 A~H 8개 장의 연속 페이지 안에서 같은 ID를 유지한다. [페이지별 검토 기록](source-audit.md)을 참조한다.

기존 112개 작성 설명은 추가 해설로 분리했고, 오류·단순화·결과 불일치에 대한 정정 19개를 별도로 표시한다. 39개 가상 사례·195개 문항, 84개 자가 점검, 진도·백업·북마크·계정 구조와 메뉴 접기는 유지한다. 원자료의 가상 투자액·가상 사용자 평점과 사이트에서 만든 가상 입력도 서로 구별한다.

## 범위와 학습 순서

개요 자료, 2주차 노션, 3주차 노션, 넷플릭스 노션 전체를 범위로 삼는다. 넷플릭스의 네트워크·텍스트·추천·회귀까지 포함한다. 학기 계획의 주차만으로 넷플릭스 심화를 제외하지 않는다. 웹사이트 PDF 3개는 같은 주제의 설명 보강만 사용한다. Titanic과 후반 학기 로드맵은 추가하지 않았다. PDF에 구체적 절차가 없는 Hadoop 설치·MapReduce 실습은 새 강의로 만들어 넣지 않는다.

강의의 핵심·목표 → 원자료 기반 본문·페이지 → 추가 정정 → 펼쳐 보는 작성 해설·코드·도식 → 자가 점검 → 가상 사례 → 종합 회차 순서다. 원자료 기반 설명은 전사가 아니라 개념·표·코드 동작을 풀어 쓴 내용이며 반복 준비 코드는 묶어서 설명한다. 그림을 사이트에 복제하지 않았다. 읽기 완료는 이해 점수와 별개다.

Python 입출력 실습은 E2/F1/F2/F3/H3/H4의 6개다. 수업 코드를 확인하는 작은 가상 입력이며 외부 CSV 없이 실행된다. H4는 TF-IDF의 fit_transform/transform과 Ridge의 fit/predict를 명시적으로 보여 준다. A~D의 실행 흉내 예제는 개념 도식·흐름으로 교체한다. 원본 PDF·추출문·개인 기록·인증정보는 저장소에 포함하지 않는다.

[실제 페이지 출처](source-map.md), [커버리지](coverage.md), [원문 오류 검토](content-issues.md)를 함께 확인한다.

## 종합 회차

CBT와 모의고사는 같은 고정 세트를 연습/시험 모드로 제공한다. 단원 필터 대신 1~5회차 중 하나를 선택한다. 각 회차는 A~H 전 범위의 50문항·10개 공통 자료이며 같은 사례의 5문항이 연속해서 나온다. 연습은 문항별 확인, 시험은 제출 후 해설을 공개한다. 기본 75분은 조절 가능한 학습용 설정이며 실제 시험 규격은 미확정이다.

| 회차 | 고정 사례 순서 | 문항 |
|---|---|---:|
'''
for b in rounds:
    doc += f"| {b['title']} | {', '.join(b['caseIds'])} | {b['defaultCount']} |\n"
doc += '''
5회차 전체에 39개 사례·195개 고유 문항이 포함된다. 일부 사례는 회차 간 반복되지만 한 회차 안에 중복 문항은 없다. 250개 고유 문항이라는 의미는 아니다. 강의·자료·오답·북마크의 개별 복습은 `/practice`로 연결한다.

## 재현과 검증

`scripts/enrichment/source_aligned.py`에 페이지별 본문·정정·내용 없는 페이지 분류를 관리한다. `scripts/generate_content.py`로 재생성해도 추가 해설 분리와 페이지 출처가 유지된다. `verify_source_alignment.py`는 페이지 누락·범위 밖 출처·중요 보충 항목과 원자료 가상 평점의 Pearson 불일치를 검사한다. 이 검사는 수동 자료 대조를 대체하지 않는다. 기존 강의·사례·문항·선지 ID와 저장 구조, cases/questions/sources/topics의 의미적 SHA-256을 유지한다.

```sh
python -m pip install -r scripts/requirements-lessons.txt
python scripts/generate_content.py
python scripts/verify_lessons.py
python scripts/verify_source_alignment.py
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
- 자동 테스트 22개와 TypeScript·Vite 빌드 통과. 4개 화면 폭에서 356개 메뉴 경로, 모든 장의 본문·정정·추가 해설·가상 사례·이전 링크·진도·백업을 별도로 검사한다.
- [자동 검산 데이터](lesson-validation.json), [브라우저 구조 검사](lesson-browser-validation.json), [기능 검증](functional-tests.md).

## 강의별 구성

본문 자수는 코드·표·풀이·자가 점검을 제외한 섹션 문단만 센다. NOT_APPLICABLE은 실행 예제가 없는 개념·자료 해석 강의다.

| 강의 | 제목 | 본문 자수 | 섹션 | 사례 풀이 | 자가 점검 | Python 출력 |
|---|---|---:|---:|---:|---:|---|
'''
for l in lessons:
    r = rows[l['id']]
    doc += f"| {l['id']} | {l['title']} | {r['bodyAfter']} | {r['sections']} | {r['workedCases']} | {r['selfChecks']} | {r['lab']} |\n"
(root / 'docs/lesson-upgrade.md').write_text(doc, encoding='utf-8')
print('lesson-upgrade.md generated')
