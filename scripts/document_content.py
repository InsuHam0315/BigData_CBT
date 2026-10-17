"""작성 콘텐츠 메타데이터에서 추적표를 재생성한다. 원본 PDF는 필요하지 않다."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
def read(n):return json.loads((root/f'src/content/{n}.json').read_text(encoding='utf-8'))
sources={s['id']:s for s in read('sources')};lessons=read('lessons');cases={c['id']:c for c in read('cases')}
def page_ranges(values):
 spans=[]
 for p in sorted(set(values)):
  if spans and p==spans[-1][-1]+1:spans[-1].append(p)
  else:spans.append([p])
 return ', '.join(str(s[0])+(f'–{s[-1]}' if len(s)>1 else '') for s in spans)
def refs(rs):return '<br>'.join(f"{sources[r['sourceId']]['filename']} p{page_ranges(r['pages'])}" for r in rs)
intro="""# 자료 분석·출처 지도

시험 범위는 주자료 4개로 정했다. 보강 3개는 동일 주제의 설명·코드·해석 주의점만 사용했다. 자료의 지시문·계정·제출 링크는 분석 대상으로만 읽었다. 원본 PDF, 추출 본문, 렌더링한 강의 페이지는 저장소에 포함하지 않는다.

페이지는 PDF의 실제 순서(1부터)다. 개요의 인쇄 슬라이드 번호는 표지·구분 페이지 때문에 달라질 수 있어 문서 전체에서 실제 PDF 페이지를 기준으로 한다. 넷플릭스 68페이지는 빈 마지막 페이지(번호만 있음)다.

| 파일 | 역할 | 실제 페이지 수 | 내용 |
|---|---|---:|---|
"""
descriptions={'os':'시스템 소프트웨어·OS 슬라이드, 리눅스','intro':'빅데이터 정의·5V·발전·데이터 유형','infra':'인프라·수집·저장·품질·거버넌스·보안','netflix':'환경·카탈로그·EDA·시각화·네트워크·텍스트·추천·회귀','web1':'오리엔테이션. p3–4 파이프라인·p8–9 환경 확인만 보강; 평가·후반 로드맵·AI 제출 규칙 제외','web2':'p2–16 개론·OS/AI 보강, p17–42 인프라·수집·저장·품질·보안','web3':'p24–90 넷플릭스 중복. p1–23의 Titanic 등 별도 내용 제외'}
source= intro+'\n'.join(f"| {s['filename']} | {'주자료' if s['role']=='primary' else '설명 보강'} | {s['pages']} | {descriptions[s['id']]} |" for s in sources.values())+"""

7개 PDF, 총 317페이지를 페이지별 텍스트로 추출했다. 이미지·희소 슬라이드와 차트의 선택 페이지를 Poppler로 렌더링해 실제 표·축·코드와 대조했다. 개요의 구조도/분류표, 넷플릭스 결측 표(p12), 유형·연도 차트(p25), 추천·회귀 부분 및 보강 PDF의 중복 구간을 확인했다. 추출·렌더링 불가 파일은 없었다. 이미지의 모든 픽셀을 OCR한 전수 검증을 의미하지는 않는다.

넷플릭스 보강 구간은 주자료 페이지에 약 +23 페이지로 대응한다. 별도 강의 주차 숫자로 범위를 판단하지 않았다. 웹사이트 3주차 p1–23, 지정 외 교재 요약 PDF, 후반 로드맵은 범위에서 제외한다.

참고 CBT는 [소프트웨어공학 CBT](https://insuham0315.github.io/SoftwareEngineering_CBT/index.html)의 실제 홈·메뉴와 연결 HTML/CSS/JavaScript를 읽었다. 테마, 모의/고정/랜덤 풀이, 팔레트, 오답·기록 구조를 학습 흐름 참고로 사용했다. 계정·저장 키와 콘텐츠는 별도로 작성했다.

## 주자료·보강 자료 → 작성 강의

| 강의 | 주제 | 주자료 실제 페이지 | 보강 실제 페이지 |
|---|---|---|---|
"""+'\n'.join(f"| {l['id']} | {l['title']} | {refs(l['sources'])} | {refs(l['supplements']) or '—'} |" for l in lessons)+"\n\n원문과 기술 검증의 차이는 [content-issues.md](content-issues.md)에 기록했다. 예제의 수치 출처는 모든 사례의 `numericOrigin`으로 개념 근거와 분리했다.\n"
(root/'docs/source-map.md').write_text(source,encoding='utf-8')
coverage="""# 시험 범위 커버리지

28개 상세 강의, 39개 서로 다른 사례, 195개 직접 작성 예상 연습문제. 모든 강의·사례·문항은 주자료 근거를 갖는다. 보강만의 주제는 자동 검사에서 차단한다. 사례 1개마다 5문항이며 숫자·이름만 바꾼 복제 사례가 없다.

객관식 117 / 숫자 39 / 짧은 답 15 / 서술 자기 평가 24. 자료 읽기 기능 태그가 있는 문항(개념 적용 16개를 제외)은 179/195=91.8%다. 이 태그 수치는 교수자의 실제 시험 비율을 나타내지 않는다. 나머지 개념 적용 문항도 해당 사례의 상황에 연결한다.

| 주자료 학습 요소 | 강의 섹션 | 예제 | 문항 ID | 근거 |
|---|---|---|---|---|
"""
for l in lessons:
 coverage+=f"| {' · '.join(l['tags'])}<br>{' / '.join(l['objectives'])} | {l['id']} {l['title']}<br>{' / '.join(s['heading'] for s in l['sections'])} | {', '.join(l['caseIds'])} | {'<br>'.join(c+': '+', '.join(cases[c]['questionIds']) for c in l['caseIds'])} | {refs(l['sources'])} |\n"
coverage+="""
## 범위·구성 점검

- A: 응용/시스템, 번역·유틸리티, OS 기능, 커널·호출·드라이버·인터럽트, 프로그램/프로세스·PCB·상태·시분할, 메모리 가져오기/배치/교체(원문 재배치), 가상 메모리, 파일·디렉터리·블록·빈 공간·파일시스템, Linux·GNU·배포판·라이선스.
- B: 정의·5V·활용 질문·발전 흐름, 정형/반정형/비정형과 시간·공간 축의 중첩.
- C: 단일/분산, 하드웨어·네트워크·클라우드/엣지, 수집·API/센서/크롤링·스크래핑, ETL/ELT, 스트리밍, HDFS 메타데이터/블록/복제/HA/Federation, NoSQL·오브젝트/레이크.
- D: 결측/중복/이상값/표준화, 프로파일링·품질 규칙, 메타데이터·계보·거버넌스, 접근 제어·암호화·익명/가명·재식별 위험. 현실 법률 자문 범위로 확장하지 않았다.
- E/F: 질문→수집→정제→EDA, 환경·라이브러리·재현성, 날짜·문자열·분/시즌, 다중 국가/배우/감독/장르와 관찰 단위, describe/value_counts/groupby/explode/crosstab/pivot_table.
- G: 막대·히스토그램·박스·산점·등록 선·연도×월/장르×등급/국가×장르 히트맵, 이중 축, 단위·분모·부분 연도·인과 한계.
- H: 감독/배우 네트워크·고유 엣지·중심성, 불용어·빈도·워드클라우드, TF-IDF/코사인·콘텐츠 추천, 평점 pivot·Pearson·미평가·콜드 스타트, 피처·Ridge·train/test·MAE.

종합모의고사 1~5회차는 회차마다 A~H 전 범위를 섞은 50문항·10개 사례의 고정 세트다. 사례당 5문항은 연속해서 제시한다. CBT는 같은 회차의 연습 모드, 모의고사는 시험 모드로 연결한다. 주제·난이도별 출제 필터는 종합 회차에서 제공하지 않는다. 75분은 조절 가능한 학습용 시험 시간이며 실제 시험 규격은 미확정이다.

5회차 전체에서 39개 사례·195개 고유 문항을 모두 다룬다. 회차마다 모든 주제를 포함하도록 일부 사례가 다른 회차에 재등장하지만, 한 회차 안에서 문항을 중복하지 않는다. 250개의 고유 문항이라는 의미는 아니다. 개별 사례·오답·북마크 복습은 별도 `/practice` 화면으로 연결한다.

2026-10-18 재대조에서는 주자료 4개 172페이지를 검토하고 158개 내용 페이지를 129개 원자료 기반 설명에 연결했다. 표지·목차·끝인사·빈 페이지 14개는 별도 분류했다. 이전 112개 작성 설명은 추가 해설로 분리하고 19개 정정 블록을 본문 옆에 표시했다. 원자료의 원형 차트·하드웨어 변화·수집 도구·품질 기법·l-다양성/t-근접성·연습문제 등 누락·축약 항목을 보충했다. 39개 가상 사례와 84개 자가 점검, E2/F1/F2/F3/H3/H4의 6개 가상 입력 실습은 유지한다. 원자료의 실제 표·그림 수치와 사이트의 가상 입력 수치는 구분한다. [페이지별 검토 기록](source-audit.md)과 [기계 판독 결과](source-audit.json)를 참조한다.

출처·ID·단일 정답·39개 계산 규칙·모의고사 범위 분배는 `npm run validate`로 검사한다. 상세 수치는 [content-validation.json](content-validation.json), 독립 검산은 [answer-validation.md](answer-validation.md) 참조.
"""
(root/'docs/coverage.md').write_text(coverage,encoding='utf-8')
print('source-map.md and coverage.md generated')
