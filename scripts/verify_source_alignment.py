"""Check the published page ledger and selected audited omissions/corrections.

The manual source review is recorded separately. Page coverage proves mapping,
not that a length threshold or a keyword search alone proves factual accuracy.
Only authored synthetic code below is executed; never execute PDF code.
"""
import json
import sys
from pathlib import Path
import pandas as pd
from enrichment.source_aligned import CONTENT, CORRECTIONS, NON_CONTENT

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
lessons = json.loads((root/'src/content/lessons.json').read_text(encoding='utf-8'))
sources = json.loads((root/'src/content/sources.json').read_text(encoding='utf-8'))
by_id = {l['id']:l for l in lessons}
assert len(lessons)==28
assert sum(len(l['additionalSections']) for l in lessons)==112
for l in lessons:
    assert l['sections']==CONTENT[l['id']], l['id']
    assert l['corrections']==CORRECTIONS.get(l['id'],[]), l['id']
    for section in l['sections']:
        assert len(section['body'])>=2 and all(section['body']), l['id']

# Important source elements that the former generic explanations omitted or
# underexplained; these must be in the primary explanation, not only in extras.
anchors = {
 'A1':['Mahout','컴파일러','유틸리티','인터럽트'],
 'A2':['일괄 처리','PCB','생성 → 준비'],
 'A3':['배치','가져오기','replacement','스왑'],
 'A4':['포맷','inode','연결','빈 공간','FAT32','SSD'],
 'A5':['GNU','FSF','Fedora','Slackware','macOS'],
 'B2':['옴니채널','정밀의료','CompStat','기후','UGC'],
 'B3':['JSON','이메일','CSV','시계열','공간'],
 'C1':['NVMe','InfiniBand','SDN','Kubernetes','이기종'],
 'C2':['GraphQL','SSE','웹훅','CDC','MQTT','NiFi'],
 'C3':['Connect','Streams','Pulsar','워터마크','멱등성'],
 'C4':['Federation','HA','Ozone','Alluxio'],
 'C5':['컬럼 패밀리','QUORUM','HBase','Cypher','Glacier','BigQuery'],
 'D1':['다중 대체','KNN','Grubbs','Isolation','Levenshtein','레코드 연결'],
 'D2':['관계 프로파일링','KS','MDM','운영 메타데이터','카탈로그'],
 'D3':['l-다양성','t-근접성','차분','동형암호','CMP','제로 트러스트'],
 'E1':['여섯 단계','show_id','description','duration'],
 'E2':['Conda','커널','head','shape','info','savefig'],
 'F1':['2,389','7,770','Unknown','합집합'],
 'F2':['strip','to_datetime','duration_unit','시즌'],
 'F3':['배우','상위 10','시즌','added_month','pivot_table'],
 'G1':['원형 차트','50개','KDE','상위 5개'],
 'G2':['4.5','17.0','가상','2021','부분 연도'],
 'G3':['첫 국가','상위 10','73','382','116'],
 'H1':['30명','Kamada','상위 15','고유'],
 'H2':['STOPWORDS','Dramas','Comedies','문맥'],
 'H3':['수프','공통','9개','NaN','콜드 스타트'],
 'H4':['5,000','0.2','42','4.19','4.83','반올림'],
}
for id, terms in anchors.items():
    text = ' '.join(s['heading']+' '+' '.join(s['body']) for s in by_id[id]['sections'])
    for term in terms: assert term in text, (id,term)

ledger=[]
for s in sources:
    if s['role']!='primary':continue
    assigned={p:[] for p in range(1,s['pages']+1)}
    for l in lessons:
        for i, section in enumerate(l['sections']):
            if section['source']['sourceId']!=s['id']:continue
            for p in section['source']['pages']:
                assert p in assigned,(s['id'],p)
                assigned[p].append(dict(lessonId=l['id'],heading=section['heading'],anchor=f"{l['id']}-section-{i}"))
    for p, targets in assigned.items():
        disposition=NON_CONTENT[s['id']].get(p)
        assert bool(targets)!=bool(disposition), ('unmapped or contradictory page',s['id'],p)
        ledger.append(dict(sourceId=s['id'],page=p,status='explained' if targets else 'non-content',
            targets=targets,reason=disposition))

# Independent reconstruction of the source's nine synthetic ratings confirms
# its Matrix/Inception=1.0 prose does not follow from that input.
ratings=pd.DataFrame({
 'user':['A','A','B','B','C','C','C','D','D'],
 'title':['Matrix','Vendetta','Sextuplets','Hangover','Matrix','Inception','Vendetta','Sextuplets','Just Go'],
 'rating':[5,4,5,4,5,5,5,4,5]})
matrix=ratings.pivot_table(index='user',columns='title',values='rating')
common=matrix[['Matrix','Inception']].dropna()
assert len(common)==1
assert pd.isna(matrix.corr(min_periods=2).loc['Matrix','Inception'])
assert len(matrix['Matrix'].dropna().unique())==1

report=dict(reviewedAt='2026-10-18',primaryPages=len(ledger),
    explainedPages=sum(p['status']=='explained' for p in ledger),
    nonContentPages=sum(p['status']=='non-content' for p in ledger),
    sourceSections=sum(len(l['sections']) for l in lessons),
    additionalSections=sum(len(l['additionalSections']) for l in lessons),
    correctionBlocks=sum(len(l['corrections']) for l in lessons),
    sourcePearson={'commonRatings':len(common),'correlation':'NaN','status':'PASS'},
    method='Manual page review and visual inspection; automated references and regression checks',
    pageLedger=ledger,status='PASS')
(root/'docs/source-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
doc='''# 원자료 재대조 기록 · 2026-10-18

기준은 개요·2주차·3주차·넷플릭스 주자료 4개, 총 172페이지다. 각 페이지를 읽고, 텍스트에서 빠지는 개요 p10·62의 도식·배포판 표, 넷플릭스 p12·25의 실행표·그림 및 관계·네트워크·텍스트·추천·회귀 결과 그림을 렌더링으로 확인했다. 기존 추출문과 원본 파일의 페이지 수·파일 해시도 확인했다. 원본 PDF·추출문·렌더 이미지는 공개 저장소에 포함하지 않는다.

158개 내용 페이지는 아래 본문에 연결하고 표지·목차·끝인사·빈 페이지 14개는 내용으로 만들지 않았다. 원자료의 단순화·오류를 재생산하는 대신 해당 위치와 별도 정정을 함께 표시한다. 본문은 원문 전사가 아니라 개념·표·그림·코드 흐름을 재설명한 것이다. 반복 준비 코드는 묶었다. 페이지 연결·키워드 검사는 참조의 누락을 방지하는 보조 수단이며 자동으로 사실 정확성이나 문장별 완전성을 증명하는 검사는 아니다.

## 보충·분리한 내용

|범위|주요 보충|
|---|---|
|A|소프트웨어 종류·컴퓨터 발전 도식, 일괄/시분할·PCB·상태, 메모리 배치, 포맷·파일 테이블·조각화·FAT, OS 계보·배포판 표|
|B|5V별 처리 과제, 원천 데이터·발전 단계·산업/공공/과학 활용, 유형과 시간·공간 축|
|C|CPU/메모리/저장/네트워크·SDN·컨테이너·특수 하드웨어, API/GraphQL/푸시/CDC, 스트림 도구, HDFS 후속 기술, NoSQL·저장 계층·웨어하우스|
|D|대체·이상 탐지·유사 매칭 기법, 품질 검증·MDM·메타데이터 종류·카탈로그, 개인정보 분류·l-다양성/t-근접성·차분 프라이버시·동형암호·CMP·다층 보안|
|E/F|12개 컬럼, 여섯 분석 단계, Conda/커널·파일/그림 준비, 원본 결측 로그, 날짜·단위·기술 통계·집계, 배우/시즌/월별 원자료 연습 항목|
|G/H|원형 차트·차트별 코드/그림 해석, 원자료 가상 투자액, 상위/첫 값 조건, 네트워크 표본/레이아웃, 장르별 텍스트 관찰, 추천·가상 평점, 회귀 분할/평가/결과 불일치|

기존 112개 작성 설명·코드·도식은 **추가 해설**, 실습의 입력과 39개 사례는 **학습용 가상 자료**, 정정 19개는 **추가 해설·정정**으로 분리했다. 자가 점검은 사이트 작성 문항으로 표시한다. 기존 195문항·정답·사례와 28개 단원 ID는 그대로 유지한다.

## 원본 확인값

|자료 ID|페이지|SHA-256|
|---|---:|---|
|os|63|f019d0db0bffbd91b3abba8530e347cd181d8df7f4752f8403d2b6e22622c0ec|
|intro|15|7aa98ebe6c5829ec40c1605c806b4e8421ccc9b140aab9df6d6f7bd5a71ffa59|
|infra|26|45b88b26cdfb59547c71e470e4b7de2c6118f20aea83ee470c93772b0c26bf24|
|netflix|68|4ebb18e7e5a33f4ec889fa3d68d816588f8f5647e0998fea9ca5e0d3f94e36ca|

## 페이지별 연결

페이지는 PDF 순서(1부터)다. A~H는 사이트의 기존 장 구분이며 원본 PDF의 장 번호와 동일한 번호 체계는 아니다.

|자료|페이지|본문 연결 또는 분류|
|---|---:|---|
'''
for entry in ledger:
    targets=' / '.join(t['lessonId']+' · '+t['heading'] for t in entry['targets']) or entry['reason']
    doc+=f"|{entry['sourceId']}|{entry['page']}|{targets}|\n"
(root/'docs/source-audit.md').write_text(doc,encoding='utf-8')
print(f"PASS: {report['sourceSections']} source explanations; {report['explainedPages']} content pages + {report['nonContentPages']} non-content pages = {len(ledger)}; {report['correctionBlocks']} corrections; source Pearson NaN confirmed")
