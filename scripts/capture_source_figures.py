"""Render the provided PDFs' actual charts/diagrams, without redrawing them."""
import hashlib
import json
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/figures'

def F(id,page,index,section,title,axes,steps,takeaway,caution=''):
 return dict(id=id,documentId='netflix',page=page,imageIndex=index,sectionId=f'netflix-s{section}',title=title,axes=axes,steps=steps,takeaway=takeaway,caution=caution)

FIGURES=[
 F('nf-monthly',19,0,4,'월별 콘텐츠 등록 수','가로=등록 월 · 세로=작품 수',
  ['아래의 1~12는 연도가 아니라 월이다.','막대 높이는 해당 월에 등록된 작품 건수다.','여러 해를 합친 월별 집계인지 확인한 뒤 높이를 비교한다.'],
  '이 그림에서는 12월 막대가 높다. 모든 연도의 매월 12월이 항상 최다라는 뜻은 아니다.'),
 F('nf-types',23,0,5,'Movie와 TV Show의 작품 수','가로=작품 유형 · 세로=작품 수',
  ['Movie와 TV Show라는 두 범주를 찾는다.','같은 세로축에서 막대 높이를 비교한다.','세로축은 시청자 수나 매출이 아니라 보유 작품 수다.'],
  '이 카탈로그에서는 영화 작품이 더 많다. 영화 시청률이 더 높다는 결론은 낼 수 없다.'),
 F('nf-hist',23,1,5,'공개 연도 히스토그램','가로=release_year 구간 · 세로=구간별 빈도',
  ['가로축은 Movie/TV 같은 범주가 아니라 연도 수치의 구간이다.','막대 하나는 그 연도 구간에 속한 작품 수다.','오른쪽에 막대가 높으면 최근 연도 구간에 작품이 많이 모였다는 뜻이다.'],
  '히스토그램은 수치의 분포를 본다. 구간 수 bins를 바꾸면 모양도 달라질 수 있다.','원본의 부드러운 곡선은 밀도 추정선이다. 곡선 높이를 별도의 원시 건수로 더하지 않는다.'),
 F('nf-pie',24,0,5,'작품 유형 구성비','조각=유형 · 조각의 넓이=전체 중 비율',
  ['원의 전체를 이 집계의 전체 작품 수로 둔다.','조각의 유형 이름과 표시된 퍼센트를 함께 읽는다.','같은 전처리 조건의 분모로 계산한 구성비끼리 비교한다.'],
  '큰 조각은 이 카탈로그에서 그 유형의 비중이 크다는 뜻이다. 인기도나 성장률은 아니다.'),
 F('nf-box',26,0,6,'관람 등급별 영화 상영 시간','가로=rating 범주 · 세로=상영 시간(분)',
  ['영화만 선택한 그림이며 TV 시즌 수와 섞지 않는다.','상자 안 선은 중앙값, 상자 아래·위는 Q1·Q3다.','상자 길이 Q3−Q1은 가운데 50%의 퍼짐이다. 바깥 점은 별도 표시된 관측값이다.'],
  '상자의 위치로 중심을, 길이로 퍼짐을 비교한다. 등급이 높아서 영화가 길어졌다는 인과관계는 증명하지 못한다.','바깥 점이라고 자동으로 입력 오류이거나 삭제 대상인 것은 아니다.'),
 F('nf-year-month',27,0,6,'연도×월 등록량 히트맵','행=등록 연도 · 열=등록 월 · 셀=등록 건수',
  ['왼쪽 연도 하나와 아래 월 하나를 고른다.','교차한 칸의 숫자가 그 연도·월의 등록 건수다.','오른쪽 색 범례에서 어떤 색이 큰 값인지 확인한다.'],
  '같은 색 범례 안에서 큰 수가 모인 시기를 찾는다. 색이 항상 진할수록 크다는 암기 대신 범례를 읽는다.'),
 F('nf-scatter',28,0,6,'공개 연도와 등록 연도 산점도','한 점=작품 · x=공개 연도 · y=등록 연도',
  ['점 하나를 골라 아래 축에서 공개 연도를 읽는다.','같은 점의 왼쪽 축에서 등록 연도를 읽는다.','예를 들어 (1960,2020)은 1960년 작품이 2020년에 등록된 경우다.'],
  '등록 연도가 더 늦으면 y>x이며 y=x 대각선 위쪽이다. 두 연도가 가깝다는 사실만으로 오리지널 작품임을 확정하지 않는다.','원문 p29의 “대각선 아래=구작” 설명은 이 축 배치와 맞지 않는다. 그림은 그대로 보존하고 좌표 해석을 바로잡았다.'),
 F('nf-trend',30,0,7,'등록 연도별 콘텐츠 수 추이','가로=등록 연도 · 세로=작품 수',
  ['연도를 시간 순서로 왼쪽부터 읽는다.','선의 높이는 현재 자료에 남아 있는 작품의 해당 등록 연도 건수다.','끝의 2021년이 전체 1년을 포함하는지 먼저 확인한다.'],
  '2021년은 부분 연도다. 낮아진 마지막 점만으로 연간 등록 전략의 축소를 단정하지 않는다.'),
 F('nf-invest-dual',31,0,7,'가상 투자액과 등록 수의 이중 축','가로=연도 · 왼쪽/오른쪽 세로축은 서로 다른 단위',
  ['각 계열의 색과 연결된 세로축을 찾는다.','투자액과 등록 수의 단위가 다르므로 높이를 직접 빼지 않는다.','같이 변하는 경향과 원인·결과의 주장을 구분한다.'],
  '이 투자액은 수업용 가상 데이터다. 그림만으로 Netflix의 실제 투자 성과나 인과 효과를 계산할 수 없다.'),
 F('nf-invest-scatter',32,0,7,'가상 투자액과 등록 수 산점도','한 점=연도별 가상 투자액·등록 수의 짝',
  ['한 점이 어느 두 값의 짝인지 축 제목부터 읽는다.','점들이 함께 증가하는 방향인지 살핀다.','회귀선과 주변 띠는 데이터의 요약 표현이며 원인 증명선이 아니다.'],
  '양의 관계가 보여도 가상 투자액이 등록 증가의 실제 원인이라고 말할 수 없다.'),
 F('nf-country-genre',39,0,8,'주요 국가×주요 장르 히트맵','행=첫 번째 국가 · 열=첫 번째 장르 · 셀=작품 수',
  ['행의 국가와 열의 장르가 만나는 칸을 찾는다.','숫자를 읽고 오른쪽 범례와 색을 대조한다.','수업 코드는 첫 국가·첫 장르만 대표값으로 쓰고 상위 항목만 남겼다.'],
  'India–Dramas 382 같은 칸은 이 선택 규칙의 보유 작품 건수다. 그 국가 이용자의 장르 선호를 직접 측정하지 않는다.'),
 F('nf-genre-rating',37,0,8,'장르×관람 등급 히트맵','행=장르 · 열=관람 등급 · 셀=조합 건수',
  ['장르 하나와 등급 하나의 교차 칸을 읽는다.','한 작품이 복수 장르 관계에 들어갈 수 있음을 기억한다.','장르 안의 등급 비중을 비교하려면 해당 행 합을 분모로 쓴다.'],
  '건수의 크기와 행 백분율은 다른 질문이다. 큰 장르가 모든 칸에서 큰 수를 보이는 효과와 구성 차이를 구별한다.'),
 F('nf-network',45,0,9,'감독–배우 협업 네트워크','노드=감독·배우 · 선=같은 작품의 감독–배우 관계',
  ['점을 세는 대신 먼저 점과 선의 정의를 확인한다.','붉은 큰 점은 감독, 푸른 작은 점은 배우라는 수업의 표시 규칙이다.','한 노드에 연결된 서로 다른 이웃 수를 중심성과 연결해 읽는다.'],
  '배치의 거리·색·점 크기만으로 흥행이나 친밀도를 알 수 없다. 감독 30명을 먼저 고른 표본의 영향도 고려한다.'),
 F('nf-word-all',51,0,10,'전체 줄거리 워드클라우드','글자 크기=단어 빈도·가중치',
  ['큰 단어를 찾되 색과 위치를 순위라고 읽지 않는다.','분석 대상은 작품 description이며 시청 후기 전체가 아니다.','불용어로 뺀 단어와 합친 문서 범위를 확인한다.'],
  'love·life·family 같은 단어가 두드러진다. 그 단어가 큰 이유를 이용자 선호나 감정 점수로 바로 바꾸지 않는다.'),
 F('nf-word-drama',51,1,10,'Dramas 줄거리 워드클라우드','대상=Dramas 포함 작품의 description',
  ['장르 필터가 적용된 일부 작품의 문서임을 확인한다.','큰 글씨가 그 범위에서 자주 나타나는 단어다.','다른 그림과 글자 크기를 비교할 때 빈도 스케일이 같은지도 확인한다.'],
  '장르별 텍스트 특징을 탐색하는 그림이다. 단어가 크다는 사실만으로 그 작품의 실제 줄거리를 단정하지 않는다.'),
 F('nf-word-comedy',51,2,10,'Comedies 줄거리 워드클라우드','대상=Comedies 포함 작품의 description',
  ['어떤 장르의 설명문을 모았는지 확인한다.','단어 크기는 빈도·가중치 표현이다.','정확한 차이를 말하려면 원래 빈도표와 집계 조건도 함께 본다.'],
  '워드클라우드는 빠른 탐색에 유용하다. 글자 위치가 사건 순서이거나 작은 단어가 무의미하다는 뜻은 아니다.'),
 F('nf-item-corr',61,0,12,'원문 아이템 유사도 히트맵','행·열=작품 · 셀=평점 기반 상관계수',
  ['같은 작품의 대각선과 다른 작품의 조합을 구별한다.','수치의 범위와 색 범례를 읽는다. 빈 칸은 0이라고 가정하지 않는다.','상관을 구하려면 공통 평가자와 평점의 변동성이 필요하다.'],
  '유사도 표라는 표현 방식은 배우되, 이 그림의 수치를 검증된 추천 성능으로 암기하지 않는다.',
  '원문 가상 평점에서는 The Matrix가 공통 평가자에게 모두 5점이고 Inception은 평가자가 한 명뿐이다. The Matrix 관련 상관은 NaN일 수 있다. p57의 두 작품 상관 1.0 설명이나 이 그림의 The Matrix 관련 숫자를 검증 없이 채택하지 않는다. 원본은 수정하지 않았다.'),
]

ENV=[
 ('env-history',10,1,'컴퓨터 발전의 분기','화살표=발전·분기의 설명', ['화살표의 출발과 도착을 따라간다.','대형·미니·워크스테이션·개인용이라는 변화와 병렬·분산의 분기를 구분한다.'],'한 줄의 단일 계보가 아니라 여러 방향으로 발전한 흐름이다.'),
 ('env-os',20,2,'운영체제의 계층과 시스템 호출','위=응용 프로그램 · 아래=하드웨어', ['응용·유틸리티, 인터페이스, 시스템 호출, 커널·드라이버, 하드웨어를 차례로 찾는다.','응용의 요청이 통제된 통로를 거쳐 자원 제어로 이어진다.'],'시스템 호출은 응용이 커널 서비스를 요청하는 통로다.'),
 ('env-state',36,4,'프로세스 네 가지 상태','원=상태 · 화살표=상태 전이', ['생성·준비·실행·완료를 찾는다.','준비→실행은 디스패치, 실행→준비는 타임아웃이다.','생성 시 PCB를 만들고 완료 시 회수하는 표기를 확인한다.'],'준비는 CPU 차례 대기, 실행은 CPU를 실제 사용하는 상태다.'),
 ('env-memory',41,5,'일괄 처리와 시분할의 메모리 비유','도마=메모리 작업 공간이라는 원문의 비유', ['왼쪽 한 작업과 오른쪽 여러 작업의 그림을 비교한다.','여러 프로세스의 공간을 배분하고 서로 보호해야 함을 연결한다.'],'그림은 동시 배치의 비유다. 한 CPU의 시분할과 여러 CPU의 병렬 실행을 같은 것으로 읽지 않는다.'),
 ('env-placement',45,5,'메모리 배치와 분할','그림=메모리의 구역 배치 비유', ['가져온 작업을 메모리의 어느 위치에 둘지 묻는다.','같은 크기의 구역과 프로세스 크기에 따른 분할을 구별한다.'],'가져오기는 언제, 배치는 어디, 교체는 무엇을 내보낼지의 질문이다.'),
 ('env-files',56,6,'파일 테이블과 저장 블록','왼쪽=파일 이름·블록 위치 · 오른쪽=저장장치', ['파일 하나를 고른다.','파일 테이블의 블록 번호를 오른쪽 격자에서 찾는다.','같은 파일의 블록이 붙어 있는지 흩어져 있는지 비교한다.'],'파일 이름과 물리적 위치를 연결하는 관리 정보가 필요하다.'),
 ('env-fragment',58,7,'저장장치 단편화','왼쪽=초기 상태 · 오른쪽=조각난 상태', ['같은 파일의 조각이 어떤 위치에 있는지 본다.','파일 조각이 멀리 떨어지면 HDD의 탐색 부담이 커질 수 있다.'],'흩어진 파일을 다시 모으는 조각모음의 목적과 연결한다. SSD에 HDD의 효과를 그대로 적용하지 않는다.'),
 ('env-free',61,7,'파일 삭제와 빈 공간 관리','그림=빈 블록을 다시 할당하는 흐름', ['삭제 전 파일이 쓰던 블록을 찾는다.','파일 관리 정보와 빈 공간 목록의 변화를 구별한다.','새 파일이 빈 블록을 재사용하는 순서를 따른다.'],'삭제 즉시 모든 실제 바이트가 지워진다는 뜻은 아니다. 덮어쓰기와 장치 동작에 따라 복구 가능성이 달라진다.'),
]
for id,page,section,title,axes,steps,takeaway in ENV:
 FIGURES.append(dict(id=id,documentId='environment',page=page,imageIndex=None,sectionId=f'environment-s{section}',title=title,axes=axes,steps=steps,takeaway=takeaway,caution=''))

def render(verify=False):
 OUT.mkdir(parents=True,exist_ok=True)
 handouts=json.loads((ROOT/'src/content/handouts.json').read_text(encoding='utf-8'))
 docs={h['id']:h for h in handouts};payload=[]
 for spec in FIGURES:
  h=docs[spec['documentId']];path=ROOT/'public/materials'/h['asset']
  assert hashlib.sha256(path.read_bytes()).hexdigest()==h['sha256']
  with pymupdf.open(path) as pdf:
   page=pdf[spec['page']-1]
   if spec['imageIndex'] is None:
    clip=page.rect
   else:
    xref=page.get_images()[spec['imageIndex']][0]
    clip=page.get_image_rects(xref)[0]+(-2,-2,2,2)
   pix=page.get_pixmap(matrix=pymupdf.Matrix(2.5,2.5),clip=clip,annots=True,alpha=False)
   asset=f'{spec["id"]}.png';data=pix.tobytes('png')
   item={**spec,'asset':asset,'clip':list(clip),'scale':2.5,'width':pix.width,'height':pix.height,'sha256':hashlib.sha256(data).hexdigest(),'pixelSha256':hashlib.sha256(pix.samples).hexdigest(),'sourceSha256':h['sha256'],'capture':'Actual PDF raster capture; no chart data or labels redrawn.'}
   if verify:
    previous=next(f for f in json.loads((ROOT/'src/content/source-figures.json').read_text(encoding='utf-8')) if f['id']==spec['id'])
    assert previous['pixelSha256']==item['pixelSha256'],spec['id']
    assert hashlib.sha256((OUT/asset).read_bytes()).hexdigest()==previous['sha256'],asset
   else:(OUT/asset).write_bytes(data)
   payload.append(item)
 if not verify:(ROOT/'src/content/source-figures.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Source figure captures:',len(payload),'PASS' if verify else 'written')

if __name__=='__main__':
 import sys
 render('--verify' in sys.argv)
