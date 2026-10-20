"""Reviewed revisions of the 200-item, three-chapter concept bank.

Keys refer to the *authoring* order of the archived edition. Published IDs are
versioned by final_scope.py so saved answers never acquire a different meaning.
All givens needed for a calculation or record interpretation belong in the item.
The source reference is evidence for the concept, never the question itself.
"""
import re

REVISIONS = {}


def revise(key, stem, *, options=None, why=None, error=None, steps=None,
           columns=None, rows=None, code=None, skill=None, pages=None, category='concept-application'):
    REVISIONS[key] = dict(stem=stem, options=options, why=why, error=error,
                          steps=steps, skill=skill, pages=pages, category=category)
    if columns or code:
        REVISIONS[key]['exhibit'] = dict(columns=columns or [], rows=rows or [], code=code)


# Round 1: source recall becomes input interpretation and self-contained arithmetic.
revise('F01Q07', '두 온도 센서의 측정값을 합친 뒤 평균이 갑자기 높아졌다. 평균 수식은 정상이다. 다음으로 확인할 항목은?',
       error='정상인 평균 수식만 반복 점검하면 입력 단위·시각의 불일치를 놓친다.')
revise('F01Q18', 'AI가 제안한 auto_schema 함수를 처음 사용하려 한다. 설치된 라이브러리에서 지원되는지 모른다. 실행 코드에 넣기 전 할 일은?',
       options=['현재 API 존재 확인', '함수 이름만 보고 채택', 'AI 설명만으로 성능 확정', '열 이름을 함수명으로 변경'],
       why='그럴듯한 함수 이름이 실제 API의 존재를 보장하지 않는다. 설치된 버전에 해당하는 API 문서와 import·호출 결과를 확인한 뒤 채택한다.',
       steps=['설치 버전에서 해당 API를 지원하는지 확인한다.', '작은 입력에서 호출하고 기대 출력과 실제 출력을 대조한다.'],
       error='코드가 자연스럽게 보인다는 이유로 API가 존재한다고 가정한다.')
revise('F01Q20', 'show_id가 서로 다른 작품을 식별하고, 각 행에 title·type·duration이 저장되어 있다. 이 표 한 행의 관찰 단위는?',
       why='작품 식별자에 제목·유형·길이가 연결되어 있으므로 한 행은 작품 한 건이다. 이용자 ID나 시청 이벤트가 없어 이용자 수·시청 수로 읽을 수 없다.')
revise('F01Q21', '아래 실행 결과를 행과 열의 의미에 맞게 읽은 것은?',
       options=['7,787개 관찰·12개 속성', '12개 관찰·7,787개 속성', '7,787개 속성·12개 파일', '12개 파일·7,787개 결측'],
       code='print(df.shape)\n# 출력: (7787, 12)',
       why='DataFrame.shape는 (행 수, 열 수) 순서다. 행은 관찰 한 건, 열은 그 관찰의 속성이므로 7,787개 관찰과 12개 속성을 뜻한다.',
       error='shape의 두 숫자를 열·행 순서로 뒤집어 읽는다.', skill='코드 읽기', pages='15', category='recall-to-interpretation')
revise('F01Q24', '다음 행에서 숫자처럼 보이는 title 값을 해석할 때 맞는 설명은?',
       options=['작품명 문자열이다', '전체 작품의 보유 비율이다', '감독 정보의 결측률이다', '시청자의 선호 비중이다'],
       columns=['show_id', 'type', 'title', 'duration'], rows=[['s1', 'TV Show', '3%', '4 Seasons']],
       why='값의 의미는 겉모양뿐 아니라 열의 정의로 결정된다. title의 3%는 작품명이고 길이는 duration의 4 Seasons에서 읽는다.',
       skill='표 해석', error='퍼센트 기호만 보고 제목을 비율로 변환한다.')
revise('F01Q28', '한 작품의 복수 장르를 한 행에 하나씩 펼쳤다. 아래 두 출력 중 17,071은 무엇을 센 값인가?',
       code='print(len(genres))                 # 17071\nprint(genres["show_id"].nunique())  # 7787',
       why='len은 펼친 표의 행, nunique는 서로 다른 작품 식별자를 센다. 장르가 여러 개인 작품은 여러 행으로 늘어나므로 17,071은 작품–장르 관계 수다.',
       skill='코드 읽기', error='전개 후 행 수를 고유 작품 수와 같다고 본다.')
revise('F01Q29', '다음 표에서 영화가 전체 작품의 약 69.1%라는 비율을 계산할 때 분모는?',
       columns=['유형', '작품 수'], rows=[['Movie', '5,377'], ['TV Show', '2,410']],
       why='서로 배타적인 두 유형의 건수를 합한 5,377+2,410=7,787작품이 전체다. 5,377÷7,787×100≈69.1%이며 이는 보유 작품 비율이다.',
       skill='표 해석', error='다른 분석에서 제외한 감독 결측이나 장르 관계 수를 분모로 가져온다.')
revise('F01Q31', '등록 작품 수를 비교하려고 한다. 아래 두 수치만으로 등록 전략이 축소되었다고 결론 내리기 어려운 핵심 이유는?',
       columns=['등록 연도', '관측 기간', '작품 수'],
       rows=[['2020', '1~12월 전체', '2,009'], ['2021', '연초 일부 기간', '117']],
       skill='표 해석', error='짧은 기간의 합계를 1년 전체 합계와 같은 조건으로 비교한다.',
       category='missing-givens')
revise('F01Q34', '처음 대기열은 0건이다. 유입 1,200건/초, 처리 900건/초가 10분간 일정하게 유지된다. 유실 없이 대기열에 쌓이는 건수는?',
       steps=['초당 순증가량은 1,200−900=300건이다.', '10분을 600초로 바꾸고 300×600=180,000건을 계산한다.'],
       error='유입 총량을 적체량으로 쓰거나 분을 초로 바꾸지 않는다.')
revise('F01Q35', '같은 10 GB 입력과 연산을 단일 장비에서는 9분, 8노드에서는 2분에 처리했다. 단일 장비 대비 속도비는?',
       error='노드 대수 8을 측정된 속도비로 그대로 쓴다.')
revise('F01Q36', '총 7,787작품 중 감독 정보가 없는 작품은 2,389건이다. 감독별 분석에서만 이 행을 제외하면 유효 작품 수는?',
       error='감독 관계 수와 감독 정보가 있는 고유 작품 수를 섞는다.', category='missing-givens')
revise('F01Q40', '전체 작품 7,787건 중 감독 정보가 있는 작품은 5,398건이다. 감독 미상 작품을 삭제한 표의 유형 비율을 전체 카탈로그 비율이라고 보고했다. 수정 방향은?',
       category='missing-givens')

# Round 2: remove administrative trivia and treat tool names as functions.
revise('F02Q08', '1차 분석 뒤 정제 규칙을 수정했다. 2차 결과가 달라진 이유를 추적하려면 두 실험에 공통으로 남길 기록은?',
       options=['입력·코드·환경·실행 로그', '완성된 그래프와 제목만 보관', '가장 빠른 실행 시간만 보관', '정제한 결과 파일명만 보관'],
       why='변경 전후 입력·코드·환경과 실행 로그가 있어야 어떤 차이가 결과를 바꿨는지 추적할 수 있다. 그래프나 최단 시간만으로는 처리 과정을 다시 확인할 수 없다.',
       error='결과만 남기고 결과가 만들어진 조건은 버린다.', category='administrative-to-concept')
revise('F02Q13', '장애 탐지 시간을 줄여 운영 결정을 개선했는지 평가한다. 중심이 되는 5V는?',
       options=['Value', 'Variety', 'Volume', 'Veracity'])
revise('F02Q17', '여러 서비스에서 발생한 로그를 Kafka로 받아 후속 저장·처리 단계에 전달한다. 이 파이프라인에서 Kafka가 맡는 중심 책임은?',
       options=['수집', '시각화', '결측값 보정', '배포 환경 관리'],
       why='책임은 제품 이름보다 주어진 사용 방식으로 판단한다. 이 상황의 Kafka는 원천 로그를 받아 다음 단계로 전달하므로 수집 역할이다.',
       error='제품 이름을 고정 분류표로만 외우고 실제 입출력 역할을 보지 않는다.')
revise('F02Q18', 'AI가 “1 TB를 8노드에서 30초 만에 처리한다”고 주장했지만 실행 로그가 없다. 채택 전 우선 할 일은?',
       why='데이터 크기 외에 연산·장비·형식·반복 측정 조건과 로그가 필요하다. 노드 대수나 단정적인 문장만으로 실행 시간을 보증할 수 없다.')
revise('F02Q21', '같은 제목의 서로 다른 작품이 있다. 작품을 안정적으로 식별하기 위해 우선 결측·중복을 검사할 열은?',
       why='작품 식별자로 설계된 show_id의 결측·중복을 우선 검사한다. 제목은 동명 작품이 가능하므로 유일한 식별자라고 가정하지 않는다.')
revise('F02Q24', 'type=Movie, title=7:19, duration=93 min인 행을 해석한 것은?',
       why='Movie는 유형, 7:19는 제목, 93 min은 상영시간이다. 제목의 콜론을 시각이나 길이 단위로 해석하면 열의 의미를 혼동한 것이다.')
revise('F02Q29', '아래 유형별 건수표에서 TV Show의 전체 대비 비율은? 소수 첫째 자리까지 반올림한다.',
       options=['30.9%', '30.7%', '69.1%', '100.0%'],
       columns=['type', '건수'], rows=[['Movie', '5,377'], ['TV Show', '2,410']],
       why='전체 작품은 5,377+2,410=7,787건이다. TV 비율은 2,410÷7,787×100≈30.9%다. 영화의 비율과 TV의 비율을 바꾸지 않는다.',
       steps=['표의 두 유형을 합해 전체 7,787건을 구한다.', 'TV 2,410건을 전체로 나누어 백분율로 바꾼다.'],
       skill='표 해석', error='구하려는 TV가 아니라 영화 건수를 분자로 쓴다.', category='recall-to-calculation')
revise('F02Q31', '작품 건수 100건과 110건을 막대로 비교한다. 작은 차이가 과장되지 않게 할 세로축 기준은?',
       why='막대그래프에서는 막대 길이가 건수를 표현한다. 축을 0에서 시작하면 100과 110의 비례를 유지하며, 99부터 시작해 길이를 1 대 11처럼 보이게 하는 왜곡을 피할 수 있다.')
revise('F02Q34', '하루 12 GB의 원본을 30일 보존하려고 한다. 압축은 하지 않는다. 필요한 공간에 관한 올바른 판단은?',
       why='12×30=360 GB는 원본 저장량이다. 임시 파일·인덱스·복제·백업을 사용한다면 그 공간은 별도로 산정해야 한다.')
revise('F02Q35', '같은 1 GB 연산의 실행 시간이 단일 장비·8노드 모두 1분이다. 분산해도 빨라지지 않은 이유로 가능한 것은?',
       why='작은 작업은 제출·통신 같은 고정 비용이 병렬 계산의 이득을 상쇄할 수 있다. 이 결과만으로 장비 고장이나 모든 크기의 분산 작업이 무효라고 단정할 수 없다.')

# Round 3: require reasoning from visible output rather than remembered values.
revise('F03Q01', '결과 그래프만 받은 팀원이 분석을 다시 실행할 수 없다. 결과가 만들어진 과정을 검증하려면 무엇을 우선 연결해야 하는가?',
       why='입력의 출처, 적용한 변환, 실행 환경과 절차가 연결되어야 결과의 근거를 추적하고 다시 실행할 수 있다. 도구 이름이나 그래프만으로 재현성을 확인할 수 없다.')
revise('F03Q04', '작은 CSV로 원본 보존·정제·집계·재실행을 연습했다. 이 연습이 더 큰 데이터 작업에도 도움이 되는 이유는?')
revise('F03Q16', '큰 CSV를 읽는 중 메모리 부족이 의심된다. 시스템의 메모리 여유를 관찰할 명령은?')
revise('F03Q17', 'Spark로 로그 형식을 변환하고 키별 합계를 계산한다. 이 작업의 중심 계층은?',
       options=['처리', '원천 수집', '실행 환경 운영', '원본 보관'],
       why='형식 변환·정리·집계는 입력을 분석 가능한 결과로 바꾸는 처리 책임이다. 원천에서 로그를 가져오는 수집, 환경을 관리하는 운영과 구별한다.')
revise('F03Q22', 'type=Movie, title=23:59, duration=78 min인 행의 올바른 해석은?',
       why='열 정의를 따라 읽으면 23:59는 작품명, 78 min은 상영시간이다. title의 숫자 모양이 시청 시각이나 영화 길이를 뜻하지 않는다.')
revise('F03Q24', '아래 코드를 실행한 뒤 출력된 12가 의미하는 것은?',
       options=['데이터 속성의 개수', '작품 관찰의 개수', '중복 식별자의 개수', '감독 결측값의 개수'],
       code='print(df.shape)     # (7787, 12)\nprint(df.shape[1])  # 12',
       why='shape의 0번 위치는 행 수, 1번 위치는 열 수다. 열은 속성이므로 12는 속성 수이며 결측·중복을 세는 결과가 아니다.',
       skill='코드 읽기', error='행·열 크기를 결측·중복 검사 결과로 해석한다.', category='recall-to-interpretation')
revise('F03Q25', '다음 결측 점검 결과를 보고 유형별 작품 수를 계산하려 한다. 적절한 처리 방침은?',
       options=['type 기준으로 전체 집계', 'director 결측 행 전부 삭제', '모든 결측값을 실제 감독명으로 채움', '감독 관계 수를 작품 수로 대체'],
       columns=['열', '결측 건수'], rows=[['type', '0'], ['director', '2,389'], ['cast', '718']],
       why='유형별 집계에는 type이 필요하고 이 열에는 결측이 없다. 감독 결측을 이유로 작품을 삭제하면 관련 없는 결측 때문에 전체 유형 구성이 달라진다.',
       skill='전처리', error='결측이 있는 행을 분석 질문과 무관하게 모두 삭제한다.', category='recall-to-application')
revise('F03Q31', '관람 등급의 결측을 아래처럼 처리했다. 교차표에 나타난 Missing을 읽는 올바른 방법은?',
       options=['등급 정보가 없는 범주', '새로 확인된 실제 관람 등급', '모든 이용자가 좋아하는 등급', 'TV 작품에만 부여되는 등급'],
       code='rating_for_table = clean["rating"].fillna("Missing")',
       why='fillna는 정보가 없던 위치에 표시값을 넣는다. Missing은 누락을 표에 남기기 위한 범주이며 실제 등급 정보가 복원된 것은 아니다.',
       skill='코드 읽기', error='결측 표시 문자열을 새로운 실제 관람 등급으로 간주한다.')
revise('F03Q32', '다음 장르 관계 집계로부터 직접 말할 수 있는 것은?',
       options=['표 안에서 International Movies가 최다', 'International Movies의 시청자가 최다', 'Dramas가 이용자 선호도 2위', 'Comedies의 투자 수익이 가장 적음'],
       columns=['장르', '작품–장르 관계 수'],
       rows=[['International Movies', '2,437'], ['Dramas', '2,106'], ['Comedies', '1,471']],
       why='제시된 세 장르 중 관계 수가 가장 많은 것은 International Movies다. 이 표에는 시청·선호·매출 관측이 없으므로 보유 관계 수를 인기나 수익으로 확대할 수 없다.',
       skill='표 해석', error='보유 작품의 집계 순위를 이용자 선호 순위로 바꿔 말한다.', category='recall-to-interpretation')
revise('F03Q34', '평균 유입은 400건/초이고 처리율은 900건/초다. 이 두 값만 보고 혼잡 시간에도 적체가 없다고 판단했다. 추가로 확인할 조건은?',
       why='평균 유입이 처리율보다 낮아도 일부 시간의 유입이 처리율을 넘으면 적체된다. 최대 유입률과 그 지속 시간을 확인해야 피크 대기열을 판단할 수 있다.',
       error='평균 처리 여력을 모든 시간대의 처리 여력으로 일반화한다.')
revise('F03Q36', '총 7,787작품 중 director 결측이 2,389건이다. 감독 결측률을 소수 첫째 자리로 반올림하면?',
       steps=['결측 건수 2,389를 전체 작품 7,787로 나눈다.', '100을 곱하면 약 30.679%이며 소수 첫째 자리까지 30.7%다.'],
       error='결측이 아닌 작품의 비율 69.3%를 결측률로 답한다.', category='missing-givens')
revise('F03Q37', '아래 코드에서 table은 장르를 행, 관람 등급을 열로 둔 건수표다. 계산 결과는?',
       code='row_pct = table.div(table.sum(axis=1), axis=0).mul(100)',
       skill='코드 읽기',
       why='table.sum(axis=1)은 각 장르의 행 합이다. axis=0으로 행에 맞춰 나눈 뒤 100을 곱하므로 각 장르 내부의 등급 백분율이 된다.',
       error='행 합을 사용한 비율을 등급별 열 비율이라고 읽는다.', category='missing-givens')
revise('F03Q39', 'CPU 여유는 크지만 RAM 압박과 디스크 중간 기록이 관찰된다. 측정 결과에 맞는 우선 대응은?')
revise('F03Q40', '작품이 복수 장르에 속하며, 2020년은 전체 연도·2021년은 연초 일부만 관측했다. 장르 비율 합 100% 초과와 2021년 적은 등록 수를 모두 오류라고 했다. 올바른 교정은?',
       category='missing-givens')

# Round 4: interpret tables, modules and performance claims without source trivia.
revise('F04Q11', 'CSV 확장자는 그대로인데 입력의 열 이름·자료형이 자주 바뀐다. 점검할 5V는?',
       options=['Variety', 'Volume', 'Velocity', 'Value'])
revise('F04Q12', '계속 RAM을 늘리는 스케일업 방식을 선택했다. 확장을 계속할 때 고려해야 하는 제약은?')
revise('F04Q16', 'Kibana에서 집계된 로그의 분포와 시간별 추이를 시각화한다. 이 상황의 중심 책임은?',
       options=['분석', '원천 파일 수집', 'CPU 실행시간 배분', '파일 이름·위치 관리'],
       why='집계 결과의 분포·추이를 시각화하고 해석하는 활동은 분석에 해당한다. 도구 자체를 외우기보다 현재 수행 중인 일을 기준으로 구분한다.')
revise('F04Q18', '현재 런타임은 Spark 3.5.x인데 AI 초안은 2.4.0 환경용 커넥터를 사용한다. 실행 전에 확인할 것은?',
       why='런타임과 의존성의 버전 조합이 지원되는지 확인해야 한다. 데이터 용량·열 구조·집계 분모만 점검해서는 라이브러리 호환 문제를 판단할 수 없다.')
revise('F04Q21', '아래 행의 duration을 수치 계산용으로 분리한 결과는?',
       options=['값 4 · 단위 Seasons', '값 4 · 단위 min', '값 3 · 단위 percent', '값 93 · 단위 min'],
       columns=['type', 'title', 'duration'], rows=[['TV Show', '3%', '4 Seasons']],
       why='duration의 숫자와 단위를 함께 분리하면 값은 4, 단위는 Seasons다. 제목의 3%를 길이로 읽거나 시즌을 분으로 바꾸면 잘못된 계산이 된다.',
       skill='전처리', error='duration의 숫자만 남기고 단위를 버린다.', category='recall-to-application')
revise('F04Q24', '다음 결측표에서 country별 보유 작품 수만 분석하려 한다. 유효 관찰 대상을 정하는 방법은?',
       options=['country 유무를 기준으로 결정', 'cast 결측도 함께 전부 삭제', 'director 결측도 함께 전부 삭제', '전체 행을 실제 국가명으로 임의 채움'],
       columns=['열', '결측 건수'], rows=[['director', '2,389'], ['cast', '718'], ['country', '507']],
       why='국가 분석에는 country의 유무와 복수 국가 처리 규칙이 필요하다. 출연진·감독 결측을 동시에 제외하면 질문과 무관한 이유로 유효 작품이 줄어든다.',
       skill='전처리', error='어떤 열이든 결측이면 모든 분석에서 제외한다.', category='recall-to-application')
revise('F04Q26', '한 PC에서는 아래 코드가 실행되지만 새 PC에는 pandas만 설치되어 있다. 재실행을 위해 추가로 확인할 사항은?',
       options=['사용자 모듈과 의존성 제공', 'pandas 내장 함수로 이름만 변경', '원본 CSV를 결과 그림으로 교체', '모든 결측 행을 삭제한 뒤 재실행'],
       code='from netflix_pipeline import prepare, normalize_multi_values\nclean = prepare(df)\ngenres = normalize_multi_values(clean, "listed_in")',
       why='import가 참조하는 netflix_pipeline은 별도 모듈이다. 해당 모듈 파일·의존성과 실행 경로가 준비되어야 하며 pandas 설치만으로 이 함수들이 제공되지는 않는다.',
       skill='코드 읽기', error='import 출처를 확인하지 않고 모든 함수를 pandas 내장이라고 가정한다.', category='recall-to-application')
revise('F04Q29', '영화 길이 요약표에서 전체 최솟값~최댓값 구간과 가운데 절반 구간을 바르게 연결한 것은?',
       options=['3~312분 / 86~114분', '86~114분 / 3~312분', '98~99.3분 / 86~114분', '3~312분 / 98~99.3분'],
       columns=['통계량', '길이(분)'],
       rows=[['최솟값', '3'], ['Q1', '86'], ['중앙값', '98'], ['평균', '99.3'], ['Q3', '114'], ['최댓값', '312']],
       why='전체 범위는 최솟값부터 최댓값까지이고 가운데 절반은 Q1부터 Q3까지다. 평균·중앙값은 위치 요약이며 분포 구간의 두 경계가 아니다.',
       skill='표 해석', error='최솟값·최댓값을 사분위수와 바꾸어 읽는다.', category='recall-to-interpretation')
revise('F04Q31', '세 작품의 장르를 한 작품–한 장르씩 펼친다. 생성되는 관계 행 수와 고유 작품 수는?',
       options=['5행 · 3작품', '3행 · 3작품', '5행 · 5작품', '3행 · 5작품'],
       columns=['show_id', 'listed_in'],
       rows=[['a', 'Dramas, Comedies'], ['b', 'Dramas'], ['c', 'Comedies, Documentaries']],
       why='작품 a는 2개, b는 1개, c는 2개 장르 관계를 만든다. 따라서 전개표는 2+1+2=5행이고 서로 다른 작품 ID는 a·b·c의 3개다.',
       steps=['각 작품에 적힌 장르 수를 더해 관계 수 5를 구한다.', '고유 show_id는 전개 전후 모두 3개임을 확인한다.'],
       skill='전처리', error='복수 장르로 늘어난 행을 신규 작품으로 센다.', pages='16,18', category='recall-to-calculation')
revise('F04Q34', '분산 장비 도입으로 분석을 더 빠르게 하려고 한다. 성능 개선을 평가하기 전에 우선 확인할 것은?',
       why='빠르게 실행되는 결과도 계산이나 집계가 틀리면 유효한 개선이 아니다. 결과 정확성을 확인한 뒤 규모·실행시간·병목을 측정하고 마감·비용에 맞춰 분산 여부를 판단한다.',
       error='정확성을 검증하지 않은 상태에서 속도와 노드 수부터 최적화한다.')

# Round 5: concrete diagnosis and arithmetic instead of file-path/data memorization.
revise('F05Q16', '컨테이너 실행 환경을 배포하고, 서비스 상태를 감시하며, 변경 사항의 테스트·배포를 자동화한다. 중심 계층은?')
revise('F05Q23', 'director 열의 None이 결측을 뜻할 때 아래 코드의 출력은?',
       options=['2', '3', '1', '0'],
       code='df = pd.DataFrame({\n    "show_id": ["a", "b", "c"],\n    "director": [None, "Kim", "Lee"]\n})\nprint(df["director"].notna().sum())',
       why='notna는 감독 정보가 있으면 True다. None 한 건을 제외한 Kim·Lee 두 행을 세므로 출력은 2이며 전체 작품 수 3과 구분한다.',
       skill='코드 읽기', error='전체 행 수 또는 결측 행 수를 비결측 건수로 답한다.', pages='15', category='recall-to-calculation')
revise('F05Q24', '동료의 분석은 shape=(7787, 12), 내 파일은 shape=(8807, 12)로 출력된다. 숫자를 강제로 맞추기 전에 우선 점검할 것은?',
       why='열 수가 같아도 파일 취득 시점·버전과 관측 대상이 다를 수 있다. 출처·스키마·행 구성을 대조하고 자기 입력에서 분석을 다시 실행한다.',
       error='다른 파일 버전일 가능성을 확인하지 않고 행을 삭제해 숫자를 맞춘다.')
revise('F05Q25', '원본 CSV를 읽어 정제한 뒤 같은 경로에 덮어썼다. 나중에 정제 규칙을 바꾸려 하니 변환 전 값을 찾을 수 없다. 예방할 방법은?',
       options=['원본 보존·가공본 별도 저장', '결과 그림으로 원본을 대체', '정제본 이름만 원본으로 변경', '첫 실행 로그만 남기고 원본 삭제'],
       why='가공 과정이 정보를 없애거나 바꿀 수 있으므로 원본을 보존하고 가공본을 다른 위치에 저장한다. 특정 폴더 이름 자체보다 변환 전 상태로 돌아갈 수 있는 구조가 중요하다.',
       error='파일 경로를 암기하는 것으로 원본 보존 원칙을 대신한다.', category='recall-to-application')
revise('F05Q29', '영화 길이의 가운데 절반은 아래 요약표에서 어느 구간에 해당하는가?',
       columns=['통계량', '분'], rows=[['최솟값', '3'], ['Q1', '86'], ['중앙값', '98'], ['Q3', '114'], ['최댓값', '312']],
       skill='표 해석', error='전체 범위나 평균 부근을 가운데 50% 구간이라고 본다.', category='missing-givens')
revise('F05Q31', '현재 카탈로그에서 등록 연도별 작품 수를 집계한 표다. 이 표가 직접 뒷받침하는 비교는?',
       options=['2020년 등록 작품이 144건 적음', '2020년 시청자가 144명 줄었음', '2020년 가입자가 144명 줄었음', '2020년 추천 성공이 144건 감소'],
       columns=['등록 연도', '현재 남아 있는 작품 수'], rows=[['2019', '2,153'], ['2020', '2,009']],
       why='2,153−2,009=144건 차이는 현재 스냅샷에 남아 있는 작품의 등록 연도별 건수 차이다. 시청자·가입자·추천 결과를 측정한 표가 아니므로 그 증감을 말할 수 없다.',
       skill='표 해석', error='작품 수 차이를 이용자 수나 서비스 효과 차이로 바꿔 말한다.', category='recall-to-interpretation')
revise('F05Q34', '유입 1,100건/초, 처리 900건/초가 5분간 일정하고 유실은 없다. 이 기간 추가되는 대기열은?',
       why='초당 순증가량은 1,100−900=200건이다. 5분=300초이므로 추가 대기열은 200×300=60,000건이다. 기존 대기열이 있다면 별도로 더한다.')
revise('F05Q36', 'genres에는 작품별 장르 관계, clean에는 작품별 관람 등급이 있다. 동일 작품의 장르와 등급을 연결할 키는?',
       code='# genres 열: show_id, value\n# clean 열: show_id, rating, release_year, duration_value\n# show_id는 작품을 식별하며 clean에서 유일하다.\ngenre_rating = genres.merge(clean, on=____, how="left")',
       why='두 표에서 같은 작품을 가리키는 show_id로 결합해야 한다. rating·release_year·duration_value는 여러 작품에서 같을 수 있어 결합 키로 쓰면 관련 없는 작품끼리 연결될 수 있다.',
       skill='코드 읽기', error='값이 같은 등급이나 연도를 같은 작품의 식별자로 취급한다.')
revise('F05Q38', 'clean의 한 행은 현재 카탈로그의 작품 한 건이다. 아래 집계 결과에서 각 숫자의 단위는?',
       code='annual = (\n    clean.dropna(subset=["added_year"])\n    .groupby("added_year")\n    .size()\n)',
       skill='코드 읽기', category='missing-givens')


def revise_row(key, fields):
    """Keep every source reference/difficulty; replace only reviewed question fields."""
    chapter, page, diff, stem, correct, w1, w2, w3, why = fields
    change = REVISIONS.get(key, {})
    page = change.get('pages') or page
    stem = change.get('stem', stem)
    options = change.get('options') or [correct, w1, w2, w3]
    why = change.get('why') or why
    # Remaining rationales must explain a concept, not appeal to document authority.
    replacements = {
        'PDF의 학습용 가정': '제시된 학습용 가정',
        'PDF 학습용 예시': '주어진 실행 시간',
        'PDF 사례에 근거한 새 상황': '연습을 위해 구성한 상황',
        'PDF의 적체 원리를 새 수치에 적용한다.': '유입률과 처리율의 차이에 지속 시간을 곱한다.',
        'PDF는 ': '', 'PDF에서는 ': '', 'PDF의 ': '',
        '수업 고정본': '제시된 카탈로그',
    }
    for before, after in replacements.items():
        why = why.replace(before, after)
    steps = change.get('steps') or re.split(r'(?<=\.)\s+', why)
    # Sentence boundaries preserve decimal literals such as 30.7 and version 3.5.
    steps = [part.strip() for part in steps if part.strip()]
    if len(steps) == 1:
        steps = re.split(r'(?<=[.!?])\s+(?!\d)', why)
    steps = [s if s.endswith(('.', '?', '!')) else s+'.' for s in steps]
    return dict(chapter=chapter, page=page, difficulty=diff, stem=stem, options=options,
                explanation=why, steps=steps,
                commonError=change.get('error') or f'“{options[1]}”와 “{options[0]}”의 차이를 구분한다.',
                skill=change.get('skill') or '개념 적용', exhibit=change.get('exhibit'),
                category=change.get('category', 'concept-retained'))
