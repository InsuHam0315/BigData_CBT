"""Build authored notes and chapter summaries; does not copy or extract PDFs.

Source paragraphs, annotation geometry, and renders remain in ignored tmp/.
Highlight IDs below were checked against the user's four annotated originals.
"""
import json
from pathlib import Path
from notebook_content import environment, bigdata, infrastructure, netflix

ROOT=Path(__file__).resolve().parents[1]
def P(term, meaning, marks=''):
    return dict(term=term,meaning=meaning,marks=marks.split())
def C(title, indexes, *points):
    return dict(title=title, sectionIndexes=indexes, points=list(points))

CHAPTERS={
'environment':[
 C('1. 소프트웨어와 빅데이터 스택',[1],
   P('시스템 소프트웨어','자원·장치·실행 환경을 관리해 응용 프로그램을 지원.','8-1 9-1'),
   P('응용 소프트웨어','문서 작성·그림 편집처럼 사용자의 실제 작업 수행.'),
   P('수업의 분류','OS·번역기·DBMS·유틸리티를 시스템 소프트웨어로 설명.'),
   P('스택','Linux → HDFS → MapReduce → 분석 라이브러리. 아래층이 위층을 지원.')),
 C('2. 운영체제·계열·배포판',[2,3,8],
   P('OS','편리한 인터페이스와 효율적인 자원 관리.','12-1'),
   P('역할','성능 향상·자원 관리·자원 보호·인터페이스.','13-1 13-2'),
   P('커널 / 시스템 호출 / 드라이버','핵심 기능 / 서비스 요청 통로 / 장치별 제어.'),
   P('Linux / 배포판','커널 / 커널과 여러 사용 도구를 묶은 구성.'),
   P('GNU·GPL','가격보다 실행·연구·수정·배포의 자유와 라이선스 조건을 구분.')),
 C('3. 프로세스 관리',[4],
   P('프로그램 ≠ 프로세스','저장된 정적 코드 ≠ 실행 중인 동적 작업.','15-1'),
   P('PCB','프로세스를 관리하는 정보. 실행 시 생성, 종료 시 회수.'),
   P('상태','생성 → 준비 → 실행 → 완료. 타임아웃이면 실행 → 준비.','36-4'),
   P('시분할','CPU 시간을 나누어 여러 작업에 번갈아 배분.')),
 C('4. 메인메모리 관리',[5],
   P('작업 공간','실행에 필요한 명령·데이터가 메모리에 올라와야 함.','41-2 41-3'),
   P('보호','OS 영역과 다른 프로세스 영역의 침범 방지.'),
   P('관리 작업','가져오기 / 배치 / 교체 = 가져올 때 / 둘 곳 / 내보낼 대상.'),
   P('가상메모리','가상 주소 공간과 실제 메모리·저장장치 연결. RAM+스왑 단순합으로 항상 정의하지 않음.','48-1 48-2')),
 C('5. 저장장치·파일시스템',[6,7],
   P('파일·디렉터리','논리적 데이터 단위 / 파일 이름·위치 등을 조직하는 계층.'),
   P('파일시스템','파일 위치·블록·빈 공간을 관리하는 저장 체계.','55-1'),
   P('빠른 / 전체 포맷','관리 구조 초기화 / 전체 영역 초기화·검사라는 자료의 구분.','55-2 55-3'),
   P('블록·단편화','할당·전송 단위 / 파일이 흩어져 HDD 탐색이 늘어나는 현상.'),
   P('삭제','빈 공간으로 표시했다고 즉시 모든 실제 데이터가 지워진 것은 아님.')),
],
'bigdata':[
 C('1. 빅데이터 정의와 5V',[1],
   P('빅데이터','기존 방식만으로 다루기 어려운 규모·속도·복잡성의 데이터.'),
   P('3V','Volume=양, Velocity=속도, Variety=형태.','2-1 2-2 3-1'),
   P('추가 V','Veracity=신뢰성, Value=활용 가치. 모든 항목이 단순 용량은 아님.'),
   P('판단','무엇이 병목인지, 무엇을 믿을 수 있는지, 어떤 결정에 쓸지 연결.')),
 C('2. 데이터의 원천',[2],
   P('SNS·웹 로그','본문·미디어·메타정보·클릭·검색·체류 기록.'),
   P('IoT','온도·진동·GPS·전력 등 연속 관측 → 예측 정비·도시 운영.'),
   P('의료','진료기록·의료영상·유전체·웨어러블은 서로 다른 원천.'),
   P('메타데이터','촬영 시각·위치처럼 데이터를 설명하는 데이터.')),
 C('3. 발전 과정',[3],
   P('큰 흐름','메인프레임 → PC·인터넷 → 웹2.0·SNS → 모바일·클라우드 → AI·엣지.'),
   P('MapReduce·Hadoop','분산 병렬 처리 모델과 생태계의 확산.'),
   P('NoSQL','유연한 데이터 모델·수평 확장 요구의 대응.'),
   P('실시간·AI','연속 유입·빠른 응답과 학습 데이터 활용의 결합.')),
 C('4. 응용 분야',[4],
   P('비즈니스·금융','추천·옴니채널·재고·신용·위험 판단.'),
   P('의료·공공','정밀의료·진단 연구·신약·교통·전력·재난 대응.'),
   P('과학','기후·천문·유전체·소재 데이터에서 패턴 발견.'),
   P('가치','데이터 원천 → 분석 → 실제 행동·판단 → 개선 효과를 연결.')),
 C('5. 데이터 형태',[5],
   P('정형','미리 정한 스키마·행·열.','11-1'),
   P('비정형','정해진 표 구조가 없는 본문·이미지·영상·오디오.','12-2'),
   P('반정형','키·태그·헤더 등 부분 구조. JSON·XML·로그·이메일.','13-1'),
   P('시계열·공간','시간 순서 / 위치라는 별도 기준. 구조 분류와 겹칠 수 있음.')),
],
'infrastructure':[
 C('1. 하드웨어·분산 인프라',[1],
   P('Scale-up / Scale-out','한 서버 강화 / 여러 서버로 분담.'),
   P('분산 설계','노드 장애를 전제로 복제·복구. 통신 비용도 고려.','2-1'),
   P('CPU·메모리','멀티코어·여러 노드 / 분산 RAM·인메모리 활용.','3-1 3-2 3-3'),
   P('클라우드·엣지','탄력적 자원 / 생성 지점 가까운 전처리.'),
   P('저장·연산 위치','HDD·SSD·NVMe와 네트워크, 범용·전용 칩을 작업에 맞게 선택.')),
 C('2. 데이터 수집',[2,3,4,5,6],
   P('크롤링 / 스크래핑','페이지 발견·방문 / 필요한 값 추출.','6-1'),
   P('API','정해진 규격으로 접근. REST·GraphQL·권한·속도 제한 확인.','7-1'),
   P('전달 방식','폴링=반복 확인, 웹훅=이벤트 통지, WebSocket=양방향, SSE=단방향.'),
   P('ETL / ELT','추출→변환→적재 / 추출→적재→변환.','10-2'),
   P('스트리밍','Producer→Topic/Partition→Consumer. 윈도우·시간·늦은 자료·중복 처리 정책 필요.'),
   P('IoT','센서→게이트웨이·엣지→클라우드. MQTT는 발행–구독.')),
 C('3. 저장 시스템',[7,8,9],
   P('HDFS','NameNode=메타데이터, DataNode=블록.','13-1 3-4'),
   P('복제·HA·Federation','블록 사본 / NameNode 장애 인계 / 이름공간 확장.'),
   P('NoSQL','문서·키–값·컬럼 패밀리·그래프, 조회 패턴으로 선택.','14-1'),
   P('오브젝트','고유 키·객체·메타데이터. 접근 빈도별 계층 선택.'),
   P('레이크 / 웨어하우스','다양한 원본·읽을 때 스키마 / 분석 구조·쓰기 전 스키마.')),
 C('4. 품질·메타데이터',[10,11],
   P('정제','결측·이상값·중복·형식을 진단하고 처리 전후 N 확인.'),
   P('프로파일링','구조·내용·관계 점검. 검증 규칙과 임계값 설정.'),
   P('메타데이터','기술 / 비즈니스 / 운영. 계보는 출처와 변환의 연결.'),
   P('카탈로그·MDM','찾을 수 있는 자산 목록 / 공통 정의·코드·기준 정보.'),
   P('드리프트','시간에 따른 분포 변화. 변화 자체를 무조건 오류로 처리하지 않음.')),
 C('5. 거버넌스·보안',[12,13],
   P('거버넌스','데이터의 책임·기준·권한·활용 체계.'),
   P('익명 / 가명','재식별 가능성 감소 / 식별자 대체와 추가 정보 분리.'),
   P('프라이버시','k=집단 크기, l=민감값 다양성, t=분포 차이. 차분 프라이버시와 동형암호는 다른 접근.'),
   P('보호 설계','목적·최소 수집·보관·동의·투명성 관리.'),
   P('다층 방어','네트워크·호스트·앱·데이터에 통제. 내부라는 이유만으로 자동 신뢰하지 않음.')),
],
'netflix':[
 C('1장. 데이터 분석 개요',[1],
   P('분석','문제→수집→전처리→EDA→모델링→해석·전달.'),
   P('다섯 질문','현황·트렌드·주요 특징·관계·키워드.','3-1 3-2 3-3 3-4 3-5'),
   P('한 행','작품 정보. 시청자나 시청 횟수가 아님.'),
   P('구분','등록일≠공개 연도, 관람 등급≠사용자 평점, 분≠시즌.')),
 C('2장. 환경 구축',[2],
   P('환경','Conda 환경 생성·활성화와 VS Code 커널 선택을 맞춤.'),
   P('첫 확인','read_csv → head·shape·info. 라이브러리 설치와 실제 실행은 별개.'),
   P('역할','Pandas=표, NumPy=배열, Matplotlib/Seaborn/Plotly=시각화.'),
   P('재현','원본·코드·버전·경로·실행 순서·출력을 기록.')),
 C('3장. 데이터 전처리',[3],
   P('전처리','누락·오류·형식을 분석 가능한 상태로 변경.','7-1'),
   P('Unknown / 삭제','이름 결측은 대체, 등록일·등급 결측은 자료의 규칙에 따라 삭제.'),
   P('날짜','strip → to_datetime → dt.year·dt.month.'),
   P('길이','값과 단위를 분리. Movie 분과 TV 시즌의 평균을 섞지 않음.'),
   P('유효 N','처리 후 실제 남은 관측 수. 열별 결측 수를 무조건 더하지 않음.')),
 C('4장. EDA',[4],
   P('EDA','구조·분포·이상점·관계를 살피며 질문을 다듬기.','12-2'),
   P('describe','수치=중심·산포·분위수, 범주=count·unique·top·freq.'),
   P('복수 값','split → explode → 빈도. 관계 수≠고유 작품 수.'),
   P('연습','배우 Top 10·TV 시즌 describe·월별 등록량. 필터·Unknown 제외·정렬 기준 확인.')),
 C('5장. 시각화',[5,6,7],
   P('히스토그램','수치 구간별 분포. bins에 따라 그림 모양이 달라짐.','21-1'),
   P('막대 / 파이','범주 건수 / 같은 전체의 구성비.'),
   P('박스 / 산점','중앙값·IQR·극단점 / 한 점의 두 변수 좌표.'),
   P('히트맵','행·열·셀의 값·범례를 함께 읽기.'),
   P('시간·투자','부분 연도와 가상 투자액을 구분. 상관≠인과.')),
 C('6장. 관계·네트워크·텍스트·추천',[8,9,10,11,12],
   P('관계표','필터·첫 국가/장르 가정·행/열 분모 확인. 공급량≠선호.'),
   P('네트워크','노드·엣지 정의와 표본 선택이 중심성 순위를 바꿈.','40-1'),
   P('워드클라우드','단어 크기=빈도·가중치. 불용어·범위가 결과를 바꿈.','51-1'),
   P('콘텐츠 추천','메타데이터 → TF-IDF → 코사인. 내용 유사성.','53-1'),
   P('아이템 협업','사용자 평점의 패턴 비교. 카탈로그의 rating과 다름.','56-1'),
   P('상관의 조건','공통 평가자·변동성이 필요. 원문 작은 가상 평점의 NaN을 추천 성공으로 읽지 않음.')),
 C('7장. 머신러닝 적용',[13],
   P('타깃','release_year 예측. X=메타데이터 텍스트, y=연도.'),
   P('학습 경계','먼저 train/test 분리. 학습은 fit_transform, 테스트는 transform.'),
   P('Ridge','L2 규제 회귀. alpha는 규제 세기.'),
   P('MAE','평균 |실제−예측|, 단위는 년. 작을수록 오차가 작음.'),
   P('원문 수치','p64=4.19, p65=4.83. 표 기준 6.22→4.83은 1.39년·약22.3% 감소.')),
]}

# Annotation indices are the original PDF page annotation order, not slide numbers.
EXPECTED_MARKS={
 'environment':'8-1 9-1 12-1 13-1 13-2 15-1 36-4 41-2 41-3 48-1 48-2 55-1 55-2 55-3 55-5',
 'bigdata':'2-1 2-2 3-1 11-1 12-2 13-1',
 'infrastructure':'2-1 3-1 3-2 3-3 3-4 6-1 7-1 10-2 13-1 14-1',
 'netflix':'3-1 3-2 3-3 3-4 3-5 7-1 12-2 21-1 32-1 40-1 51-1 53-1 56-1',
}

def decorate(obj, key, pages):
    obj['pages']=obj.get('pages',pages)
    obj['highlightIds']=[f'{key}-p{token.split("-")[0]}-a{token.split("-")[1]}' for token in obj.pop('marks',[])]
    obj['pages']=sorted(set(obj['pages'])|{int(mark.split('-p')[1].split('-a')[0]) for mark in obj['highlightIds']})

def build():
    handouts=json.loads((ROOT/'src/content/handouts.json').read_text(encoding='utf-8'))
    documents=[]
    for h,module in zip(handouts,[environment,bigdata,infrastructure,netflix]):
        key=h['id']; sections=module.SECTIONS; used=set()
        for i,s in enumerate(sections,1):
            s['id']=f'{key}-s{i}'
            s['pages']=[p for p in s['pages'] if p not in module.EXCLUDED]
            for j,b in enumerate(s['blocks'],1):
                b['id']=f'{s["id"]}-b{j}'; decorate(b,key,s['pages']); used.update(b['highlightIds'])
                for row in b.get('rows',[]):
                    decorate(row,key,b['pages']);used.update(row['highlightIds'])
        expected={f'{key}-p{p.split("-")[0]}-a{p.split("-")[1]}' for p in EXPECTED_MARKS[key].split()}
        assert used==expected,(key,used^expected)
        covered={p for s in sections for p in s['pages']}
        assert covered.isdisjoint(module.EXCLUDED)
        assert covered|set(module.EXCLUDED)==set(range(1,h['pages']+1))
        chapters=CHAPTERS[key]
        for i,c in enumerate(chapters,1):
            c['id']=f'{key}-chapter-{i}'
            c['sectionIds']=[sections[n-1]['id'] for n in c.pop('sectionIndexes')]
            cp=sorted({p for s in sections if s['id'] in c['sectionIds'] for p in s['pages']})
            for point in c['points']:decorate(point,key,cp)
        assert set(s for c in chapters for s in c['sectionIds'])==set(s['id'] for s in sections)
        documents.append(dict(id=key,title=h['title'],number=h['number'],filename=h['filename'],sourceSha256=h['sha256'],pageCount=h['pages'],sections=sections,chapters=chapters,
          excludedPages=[dict(page=p,reason=reason) for p,reason in module.EXCLUDED.items()],highlightCount=len(expected)))
    payload=dict(edition='2026-10-21',documents=documents)
    (ROOT/'src/content/notebook.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Notebook:',len(documents),'documents,',sum(len(d['chapters']) for d in documents),'chapter summaries,',sum(len(d['sections']) for d in documents),'sections,',sum(d['highlightCount'] for d in documents),'verified highlights')

if __name__=='__main__':build()
