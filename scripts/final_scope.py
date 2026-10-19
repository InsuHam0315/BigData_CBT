"""Author the final-scope edition without changing legacy IDs or source content.

Input is the user's 19-page 빅데이터1-3장.pdf (SHA256 below).
All questions are original practice items, not professor-authored exam questions.
"""
import json, random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/content/final'
SOURCE = {'id': 'FINAL19', 'filename': '빅데이터1-3장.pdf', 'role': 'primary', 'pages': 19}
META = {'sourceSha256': '6cbe025e389ea127ef3755a7404d76ba09af031102442b8acfe1aabb9bfb4f65', 'pages': 19, 'edition': '2026-10-19', 'questionsPerRound': 40, 'difficulty': {'상': 2, '중': 6, '중하': 32}, 'answerPositions': [10,10,10,10]}

def section(pages, heading, *body):
    return {'heading': heading, 'body': list(body), 'source': {'sourceId':'FINAL19','pages':pages}}

NOTES = [
('프로젝트의 전체 구조와 학습 준비', '역할 구분 · 파이프라인 · 재현성', [
section([1,2,3], '1. 학습의 출발점: 질문과 관찰 단위',
'전체 흐름은 질문 설정 → 데이터 확인 → 정제·전처리 → 지표 계산 → 표·차트 → 해석과 한계다. 도구 이름보다 데이터의 출처, 변환 과정, 다시 실행할 조건을 설명하는 것이 목표다.',
'파일은 입력이고 프로그램은 입력을 읽어 출력을 만든다. CSV를 읽어 만든 장르 집계표는 출력이다. 입력이 같아도 코드·버전이 달라지면 결과가 달라질 수 있으므로 결과 그림만 보관해서는 과정을 재현할 수 없다.',
'질문을 정할 때 한 행이 무엇인지, 답에 필요한 열이 있는지 먼저 확인한다. Netflix 카탈로그 한 행은 작품 정보이며 이용자 한 명이나 시청 한 번이 아니다.'),
section([3,4], '2. 빅데이터 처리·DevOps·생성형 AI의 역할',
'빅데이터 처리는 데이터의 규모와 유입 흐름에 따른 저장·전달·계산 병목을 다룬다. 파일 수·크기·갱신 속도가 커질 때 분산 저장과 계산을 검토한다. 작은 CSV로도 품질과 파이프라인 원리를 연습할 수 있다.',
'DevOps는 작성자 PC에서 한 번 실행된 분석을 다른 환경에서도 반복 가능하게 만드는 일이다. Python·라이브러리 버전, 경로, 환경변수, 실행 순서와 테스트·배포 절차를 기록한다. Docker는 환경 차이를 줄이지만 데이터와 코드의 정확성까지 보증하지 않는다.',
'생성형 AI는 설명·코드·설정의 초안을 제안한다. 실제 열 이름, 설치된 버전, 실행 결과, 문서와 대조해야 채택할 수 있다. 검증되지 않은 AI 답변을 또 다른 AI의 동의만으로 확정하지 않는다. 채택 판단과 제출 책임은 사람에게 있다.',
'공개 CSV의 결측 처리·집계는 데이터 처리, 같은 Python 환경 구성은 DevOps, AI 집계 초안을 실제 입력·출력과 대조하는 일은 AI 활용이다. 세 역할은 한 과제에서 연결된다.'),
section([4], '3. 파이프라인 다섯 단계와 실패 지점',
'수집: 원천에서 데이터를 가져온다. 공개 페이지 → 다운로드 CSV가 예다. 잘못된 파일이나 일부만 받은 상태가 실패다.',
'저장: 원본과 가공본을 보관한다. 원본을 덮어써 변환 전 상태를 잃는 것이 대표 실패다.',
'처리: 결측·형식·결합 규칙으로 분석 가능한 표를 만든다. 결측을 실제 관측값으로 다루면 오류가 생긴다.',
'분석: 질문에 맞는 지표·집계표·차트를 만든다. 작품 건수를 시청 인기라고 해석하는 오류를 경계한다.',
'배포: 코드·환경·결과·실행 방법을 다른 사람이 확인하고 다시 실행하도록 제공한다. 작성자 컴퓨터에서만 동작하면 부족하다.',
'다섯 단계는 다섯 대 서버를 뜻하지 않는다. 책임을 나누는 기준이다. 하나의 도구가 저장과 집계 등 여러 책임을 맡을 수도 있다.',
'인터페이스는 단계 사이의 입력·출력 계약이다. date_added를 기대하는 처리 코드에 added_date가 들어오면 각 프로그램이 따로 동작해도 연결은 실패한다. 어느 단계의 어떤 입력·출력이 달랐는지 좁혀 진단한다.'),
section([5], '4. PDF 속 적용 사례: 센서와 Netflix',
'강의실 센서: 매분 온도 수신(수집) → 원본 시각·온도 보관(저장) → 단위·결측 확인(처리) → 시간대 평균·급등 탐색(분석) → 그래프·절차 공유(배포). 평균이 높을 때 계산식만 보지 말고 센서 단위와 시각도 되짚는다.',
'Netflix: CSV 입수 → 원본 별도 보관 → 등록일 날짜 변환·복수 장르 분리 → 유형별 작품 수·등록 연도 집계 → 코드와 환경 공유. 이 자료만으로 시청자 수는 알 수 없다.'),
section([5,6], '5. 산출물 연결과 재현성 점검',
'환경 설명·저장소 구조는 후속 코드와 실험의 기반이다. 처리 코드·실행 로그는 비교 실험의 기준이 된다. 최종 보고서는 방법·결과·한계를 확인할 수 있도록 이 기록을 연결한다.',
'재현성을 위해 데이터 취득 방법·원본, 코드, Python과 의존성 버전, 경로·환경변수, 실행 순서, 관찰한 출력과 판단 근거를 남긴다. 설치 버전이 출력되는 것과 실제 작업이 성공하는 것은 다르다.',
'A는 100행, B는 100만 행을 처리한 시간만 비교하면 공정하지 않다. 같은 입력·조건·측정 방법을 기록해야 성능 차이를 해석할 수 있다.',
'평가에는 프로젝트·시험·과제·출석·참여가 연결된다. 정확한 비중과 일정은 학기 공지가 우선이다. 이 PDF에 없는 날짜·배점을 외울 대상으로 만들지 않는다.',
'필수 구분: 원본/정제본, 설치/실행, 지표/원인 해석, AI 초안/검증 코드, 코드 보관/재현 가능한 제출물. 환경 기록은 “최신 버전”이 아니라 실제 관찰한 버전과 문제를 적는다.')]),
('빅데이터 개론과 생성형 AI 활용', '5V · 규모와 병목 · 운영체제 · AI 검증', [
section([7,8], '1. 처리 규모를 판단하기 위한 기본 용어',
'행은 관찰 대상 한 건, 열은 속성이다. 같은 행 수라도 문자열 길이·자료형이 다르면 파일 크기와 RAM 사용량은 달라진다. SSD의 CSV 크기와 pandas가 RAM에 펼친 크기도 같다고 볼 수 없다.',
'처리량은 단위 시간에 처리한 건수(건/초), 지연은 한 건이 들어와 결과가 나올 때까지의 시간이다. 유입률이 처리율보다 크면 대기열이 늘어난다.',
'배치는 일정 기간 자료를 모아 처리하고, 스트리밍은 계속 유입되는 이벤트를 지속 처리한다. “실시간” 대신 “5분 이내”처럼 허용 지연을 수치로 정한다.',
'병목은 전체 시간을 가장 제한하는 자원이다. CPU 사용률이 낮아도 디스크 읽기나 네트워크 대기 때문에 느릴 수 있다. 이 장은 HDFS 설치·명령, 블록·복제 상세, Spark 실행자 내부, Titanic EDA를 다루지 않는다.'),
section([8,9], '2. 5V를 측정 가능한 질문으로 바꾸기',
'Volume(양): 현재 용량·증가량·읽는 양은 얼마인가? PDF 예는 현재 300 GB, 하루 12 GB 증가다. 디스크뿐 아니라 RAM과 읽는 시간도 확인한다.',
'Velocity(속도): 유입은 얼마나 빠르고 언제 결과가 필요한가? 예: 초당 400건, 5분 내 집계. 유입률과 허용 지연을 구별한다.',
'Variety(형태): CSV·JSON 등 입력 형식과 구조가 얼마나 다양한가? 파일 확장자뿐 아니라 열 이름·자료형 변화도 확인한다.',
'Veracity(신뢰성): 결측·오류·중복은 어느 정도인가? 결측률 2%, 중복률 1%처럼 측정하고 처리 전후 건수를 기록한다.',
'Value(가치): 결과로 어떤 의사결정을 개선하는가? 예: 장애 탐지 시간 단축. 파일이 크다는 사실만으로 가치가 생기지 않는다.',
'빅데이터 여부를 고정 GB 기준으로 정하지 않는다. 같은 100 GB라도 월간 보고서는 실행 시간·RAM·마감이, 2분 내 장애 알림은 유입률·처리율·지연이 우선이다.'),
section([9], '3. PDF의 학습용 계산: 적체와 보존 용량',
'아래는 실측이 아닌 PDF의 학습용 가정이다. 하루 12 GB를 30일 보존하면 원본만 360 GB다. 임시 파일·인덱스·복제·백업 공간이 더 필요할 수 있다.',
'평균 유입 400건/초, 최대 1,200건/초, 처리 900건/초라면 평균 구간에는 처리 여력이 있지만 피크에는 초당 300건이 쌓인다. 10분 = 600초이므로 피크 적체는 300 × 600 = 180,000건이다.',
'평균 유입만으로 피크 대응을 판단하지 않는다. 로그 크기 분포·압축률·처리 방식·허용 지연이 바뀌면 계산도 달라진다. 360 GB라는 숫자만으로 분산 도입을 결정할 수 없다.'),
section([9,10], '4. 스케일업·스케일아웃과 성능 비교',
'스케일업은 한 장비의 CPU·RAM·저장장치를 강화한다. 단일 장비 코드를 유지하기 쉽지만 최대 사양·비용·한 장비 장애의 제약이 있다. 스케일아웃은 여러 장비에 데이터·계산을 나누며 분배·통신·재시도와 부분 장애를 고려한다.',
'RAM 부족이라면 분할 읽기·더 큰 RAM·분산을 검토한다. RAM 병목을 네트워크 증설만으로 해결할 수는 없다.',
'PDF의 예시 시간(실제 장비 실측 아님): 1 GB는 단일/8노드 모두 1분, 10 GB는 9분/2분, 100 GB는 88분/13분이다. 속도비는 단일 시간 ÷ 분산 시간으로 4.5배, 약 6.8배다. 8노드가 반드시 8배 빠르지는 않다.',
'작업 제출·통신·셔플·병렬화 불가 부분의 비용이 있다. 1 GB에서는 고정 비용이 이득을 상쇄한다. 실제 비교는 같은 데이터·집계·환경에서 여러 번 측정한다.',
'판단 순서: 정확성 확인 → 데이터 크기·실행 시간 측정 → CPU·RAM·디스크·네트워크 병목 확인 → 마감·비용 비교 → 단일 장비 개선으로 부족하면 분산 검토.'),
section([10,11], '5. 처리 계층과 운영체제 자원',
'수집(Kafka·Filebeat·Logstash)은 로그를 받아들이고, 저장(HDFS·객체 저장소)은 자료를 유지하며, 처리(MapReduce·Spark)는 정리·변환·집계를 맡는다. 분석(Elasticsearch·Kibana 예시)은 검색·분포·시각화를, 운영(Docker·Kubernetes·CI/CD)은 배포·감시·환경 일관성을 맡는다. 역할 기준이며 제품 하나가 한 책임에만 고정되는 것은 아니다.',
'프로세스는 실행 중인 프로그램이다. CPU는 실행 시간을 배분하고, 메모리는 계산 중인 데이터를 담으며, 파일시스템은 이름·위치로 파일을 관리한다. 네트워크는 다른 컴퓨터와 데이터를 교환한다.',
'ps는 프로세스, free는 메모리, df는 파일시스템 공간을 살피는 진단 출발점이다. ps 한 번의 높은 CPU 수치로 원인을 확정하지 않는다. 메모리 압박·디스크 여유 부족·네트워크 대기를 각각 관찰한다.'),
section([11], '6. 생성형 AI 초안 검증과 기록',
'검증 순서는 제안 → 확인 → 실행 → 기록이다. 함수 존재, 현재 버전, 작은 입력에서의 실제 결과, 성능 수치의 측정 조건을 나누어 확인한다.',
'PDF의 검증 전 예시에는 존재하지 않는 auto_schema 함수와 KafkaStreamReader 클래스, Spark 3.5.x 환경에 2.4.0용 커넥터를 섞는 오류, 근거 없는 “1 TB·8노드·30초” 주장이 나온다. 이 이름을 정답 API로 암기하지 않는다.',
'현재 버전 공식 API와 import 결과를 대조한다. import 실패는 현재 환경에서 사용 가능하지 않다는 증거다. 성능은 데이터 크기·장비·파일 형식·반복 횟수·측정 로그가 필요하다.',
'실패한 내용·관찰 증거·수정 방안을 함께 기록한다. 실행 성공만으로 분석 질문·관찰 단위·결측 처리·집계 정확성이 검증되지는 않는다. AI 비교표도 현재 버전과 다를 수 있다.')]),
('Netflix 카탈로그 정제와 탐색적 분석', '스키마 · 품질 진단 · 전처리 · EDA와 해석 한계', [
section([12,13,14], '1. Kaggle과 분석 가능한 질문',
'Dataset은 데이터 파일과 설명, Code/Notebook은 실행 코드, Competition은 정해진 문제·평가 방식, Discussion은 질문·의견을 제공한다. 타인 Notebook은 다른 시점 파일을 사용했을 수 있으므로 행·열·파일 버전을 대조하고 자기 파일에서 다시 실행한다.',
'이번 고정본은 7,787행 × 12열, 한 행은 영화 또는 TV 작품 한 건이다. type·rating은 범주형, release_year는 시간의 위치, duration은 단위가 섞인 문자열이다.',
'가능: 유형별 작품 수(type), 장르별 보유 작품 수(listed_in 분리), 메타데이터 품질. 불가능: 최다 시청·선호(재생 로그·고유 시청자·시청 시간 필요), 가입 증가의 원인(가입·해지·가격·광고 등과 인과 설계 필요), 개인 추천의 효과(사용자별 시청·검색·평가와 검증 자료 필요).',
'이 파일은 특정 시점의 스냅샷이다. 삭제된 과거 콘텐츠가 빠질 수 있고 이용자의 무작위 표본도 아니다. 공급 구성을 시청 선호나 모든 시점의 전체 작품으로 확대하지 않는다.'),
section([14,15], '2. 12개 열과 실제 첫 세 행 읽기',
'show_id=작품 식별자, type=Movie/TV Show, title=작품명, director=감독, cast=출연진, country=제작 국가, date_added=Netflix 등록일, release_year=최초 공개 연도, rating=시청 등급, duration=영화 분/TV 시즌, listed_in=쉼표로 나뉜 복수 장르, description=작품 소개문이다.',
'director·cast·country는 결측 또는 복수값일 수 있다. rating은 사용자 별점이 아니고 description은 시청 후기나 반응이 아니다. 같은 제목만으로 같은 작품이라 단정하지 않는다.',
's1: TV Show, 제목 3%, Brazil, 공개 2020년, TV-MA, 4 Seasons, 감독 결측. s2: Movie, 제목 7:19, Mexico, 공개 2016년, TV-MA, 93 min, 감독 Jorge Michel Grau. s3: Movie, 제목 23:59, Singapore, 공개 2011년, R, 78 min, 감독 Gilbert Chan.',
'3%·7:19·23:59는 title의 문자열이다. 비율·시각·상영시간으로 읽지 말고 같은 행의 type·duration과 연결해 읽는다.'),
section([15,16], '3. 원본 확인·결측·중복·이상값 진단',
'입력 예는 data/raw/netflix_titles.csv다. 원본을 덮어쓰지 않는다. read_csv 후 shape=(7787,12), head(3), 열 이름, show_id 결측·중복을 확인한다. 고정본에서 show_id 결측과 중복은 0이다.',
'isna().sum()은 결측 건수, isna().mean()*100은 열별 결측 비율이다. director 2,389건(약 30.7%), cast 718건, country 507건이 누락됐다. 공백만 있는 문자열은 isna()만으로 잡히지 않을 수 있으므로 strip 등으로 확인한다.',
'감독이 비었다고 모든 분석에서 삭제하지 않는다. 감독 분석의 알려진 작품 수는 7,787−2,389=5,398이지만 유형 분석은 전체 7,787건을 쓸 수 있다. 질문별 유효 N과 제외 규칙을 기록한다.',
'show_id 중복은 식별자 계약 문제다. title 중복은 동명·재공개일 수 있어 자동 삭제하지 않는다. 300분 초과 영화도 긴 정상 작품일 수 있으므로 원문을 조사한다.'),
section([16], '4. 정제·전처리·관계형 표의 차이',
'정제는 공백·표기·형식 오류를 고치는 일, 전처리는 날짜 파생 변수나 복수값 관계표처럼 분석 가능한 표현을 만드는 일, EDA는 분포와 관계를 탐색하는 일이다. 진단 → 처리 규칙 → 변환 → 사후 검증으로 진행한다.',
'Unknown으로 채우면 정보가 생기는 것이 아니라 미상 범주가 생긴다. Unknown을 실존 감독처럼 순위에 넣지 않는다. 제외하거나 별도 표시하고 건수를 남긴다.',
'PDF 코드는 수업 제공 모듈 netflix_pipeline의 prepare(df), normalize_multi_values(clean,"listed_in")를 사용한다. 표준 pandas 내장 함수라는 뜻이 아니다. 원본 df를 보존하고 clean과 genres를 만든다.',
'duration_value와 duration_unit을 분리하면 첫 행은 4/Seasons, 둘째는 93/min이다. 영화 93분과 TV 4시즌의 평균은 단위가 달라 의미 없다. added_year와 release_year도 서로 다른 사건이다.',
'복수값을 작품–값 한 쌍씩 펼친다. 장르 관계 17,071건/7,787작품, 감독 관계 6,114건/5,398작품, 출연진 관계 55,953건/7,069작품, 국가 관계 9,063건/7,280작품이다. 관계 수와 고유 작품 수를 구별한다.'),
section([13,16,17], '5. 단변량 EDA: 유형과 영화 길이',
'범주형 한 변수는 빈도표·막대그래프, 수치형 한 변수는 평균·중앙값·사분위수·히스토그램·상자그림으로 살핀다. 평균은 극단값에 민감하고 중앙값은 정렬한 가운데 위치다. Q1·Q3는 25%·75% 지점이다.',
'type.value_counts() 결과는 Movie 5,377(69.1%), TV Show 2,410(30.9%)이다. 분모는 7,787작품이다. 이는 영화 보유 비중이며 영화 시청률이 아니다.',
'Movie이면서 duration_unit이 min인 행만 골라 결측을 뺀 수치로 영화 길이를 분석한다. 고정본 영화 5,377편의 평균 약 99.3분, 중앙값 98분, Q1 86분, Q3 114분, 최솟값 3분, 최댓값 312분이다. IQR=114−86=28분, 가운데 절반은 86–114분이다.',
'막대그래프의 세로축은 빈도 비교를 위해 0부터 시작한다. 히스토그램은 구간 폭·구간 수에 따라 모양이 달라지므로 축과 구간을 함께 본다. 상자그림의 극단 점만으로 오류나 삭제를 확정하지 않는다.'),
section([17], '6. 이변량 EDA: 장르×등급, 등급×길이',
'genres를 show_id로 clean의 rating과 왼쪽 결합한 뒤 장르×등급 crosstab을 만든다. 관찰 단위는 작품–장르 관계다. 한 작품의 여러 장르 관계가 독립 이용자 표본을 뜻하지 않는다.',
'건수표 한 칸 200은 해당 장르–등급 관계 200건이다. 행 비율표 한 칸 40은 그 장르의 전체 관계 중 해당 등급이 40%라는 뜻이다. 장르 안의 등급 구성을 비교하려면 각 칸을 해당 행의 합으로 나눈다.',
'table.sum(axis=1)은 행 합, nlargest(5)는 관계 수 상위 다섯 장르, top.div(top.sum(axis=1),axis=0).mul(100)은 행 백분율이다. rating 누락을 Missing으로 표시해 조용히 제외하지 않는다. Missing은 실제 관람 등급이 아니다.',
'등급별 길이는 Movie만 골라 유효 N·중앙값·IQR을 함께 비교한다. 적은 N이나 크게 겹치는 상자를 보고 차이를 과장하지 않는다. 등급과 길이의 관찰된 관계만으로 등급이 길이를 바꿨다는 인과 주장은 성립하지 않는다.'),
section([18], '7. 시간 EDA와 다중값 장르 해석',
'2010년 공개 영화가 2019년 등록되는 것은 자연스럽다. added_year−release_year가 음수인 후보 12건은 정의·원문 확인 대상이다. 음수라는 이유만으로 자동 삭제하지 않는다.',
'등록 연도 집계는 added_year 결측을 제외한 후 groupby().size()로 만든다. 현재 스냅샷에 남은 작품의 등록일 분포이며 과거의 완전한 입출고 기록이 아니다.',
'2017년 1,225건, 2018년 1,685건, 2019년 2,153건, 2020년 2,009건, 2021년 117건이다. 2021년은 부분 연도여서 2020년 전체와 바로 비교해 등록 전략 축소를 단정하지 않는다.',
'상위 장르 관계 수는 International Movies 2,437, Dramas 2,106, Comedies 1,471이다. genres.value.value_counts()는 작품–장르 관계를 센다. 장르별 고유 작품 보유 비율을 전체 작품 수로 나눠 더하면 복수 소속 때문에 100%를 넘을 수 있다.'),
section([18,19], '8. 시험 전 문장 교정과 분석 순서',
'“rating이 높아 인기” → rating은 관람 등급이다. “International Movies가 인기 1위” → 이 스냅샷에서 해당 장르 관계 2,437건이다.',
'“2021년 등록이 급감” → 부분 연도 117건이며 기간이 달라 직접 비교할 수 없다. “전체 duration 평균” → 분과 시즌을 분리한다.',
'“감독 결측을 모두 삭제” → 감독을 묻는 분석에서 처리 규칙·유효 N을 밝힌다. “17,071편 작품” → 7,787작품에서 펼친 17,071장르 관계다.',
'분석 순서: 질문 → 관찰 단위·필요 열 → 품질 진단 → 정제·전처리 → 지표·분모 → 표·차트 → 사실과 한계. 사용자 시청·선호·가입·수익·추천 효과는 현재 카탈로그만으로 평가할 수 없다.')])]

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    topics=[]; lessons=[]
    for n,(title,subtitle,sections) in enumerate(NOTES,1):
        topic=f'F{n}'; lid=f'FN{n}'
        topics.append({'id':topic,'title':f'{n}장 · {title}','subtitle':subtitle})
        lessons.append(dict(id=lid,topic=topic,title=f'{n}장 · {title}',minutes=[30,40,65][n-1],intro=subtitle,prerequisiteIds=[],walkthrough=[],workedExamples=[],codeKind='diagram',selfChecks=[],keyPoints=[s['heading'] for s in sections],tags=['최종 범위'],objectives=[s['heading'] for s in sections],sections=sections,additionalSections=[],corrections=[],terms=[],code='',codeNotes=[],readOrder=[],mistakes=[],check={'question':'','answer':''},caseIds=[f'FC{n}'],sources=[{'sourceId':'FINAL19','pages':sorted({p for s in sections for p in s['source']['pages']})}],supplements=[]))
    bank=[]; rounds=[]
    for r in range(1,6):
        lines=(ROOT/f'scripts/final_questions/round{r}.txt').read_text(encoding='utf-8').splitlines()
        positions=list(range(4))*10
        random.Random(4019+r).shuffle(positions)
        ids=[]
        for line in lines:
            if not line.strip() or line.startswith('#'):continue
            chapter,page,diff,stem,correct,w1,w2,w3,why=line.split('|')
            i=len(ids); qid=f'F{r:02d}Q{i+1:02d}'; ids.append(qid)
            options=[correct,w1,w2,w3]
            wrong=options[1:]; random.Random(r*100+i).shuffle(wrong)
            ordered=wrong[:]; ordered.insert(positions[i],correct)
            choices=[{'id':f'{qid}-{j+1}','text':s,'reason':why if s==correct else f'이 문항의 기준과 다릅니다. {why}'} for j,s in enumerate(ordered)]
            bank.append(dict(id=qid,caseId=f'FC{chapter}',topic=f'F{chapter}',kind='choice',difficulty=diff,skill='개념 적용',mistake='개념',stem=stem,choices=choices,correctId=choices[positions[i]]['id'],explanation=why,steps=[f'최종 범위 PDF p{page}의 정의·조건과 선지를 비교합니다.'],commonError='용어·단위·관찰 대상 또는 판단 근거를 바꾸어 읽지 않습니다.',lessonId=f'FN{chapter}',sources=[{'sourceId':'FINAL19','pages':[int(p) for p in page.split(',')]}],origin='직접 작성한 예상 연습문제'))
        assert len(ids)==40,(r,len(ids))
        random.Random(1900+r).shuffle(ids)
        rounds.append(dict(id=f'final-{r}',title=f'최종 범위 모의고사 {r}회',description='최종 범위 PDF 1~3장 · 4지선다 40문항',caseIds=[],questionIds=ids,defaultCount=40,defaultMinutes=60))
    cases=[]
    for n in range(1,4):
        cases.append(dict(id=f'FC{n}',topic=f'F{n}',title=topics[n-1]['title'],scenario='최종 범위 PDF 기반 직접 작성 예상문제입니다.',unit='문항',validN=0,exclusions='문제에 명시된 조건을 따릅니다.',assumptions=[],synthetic=True,numericOrigin='PDF의 수치와 새 학습용 가정은 문항에서 구분합니다.',columns=[],rows=[],code='',codeNotes=[],guide=[],lessonId=f'FN{n}',sources=lessons[n-1]['sources'],supplements=[],questionIds=[q['id'] for q in bank if q['topic']==f'F{n}']))
    for name,data in [('meta',META),('sources',[SOURCE]),('topics',topics),('lessons',lessons),('questions',bank),('cases',cases),('blueprints',rounds)]:
        (OUT/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Final scope: 3 chapters,',len(bank),'questions, 5 rounds')

if __name__=='__main__':build()
