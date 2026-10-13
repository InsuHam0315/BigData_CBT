"""Small, self-contained synthetic inputs and literal verified stdout."""
LABS = {}


def lab(id, code, output, notes, kind='개념 계산'):
    LABS[id] = dict(code=code.strip(), output=output, notes=notes.split('|'), kind=kind)


lab('A1', '''
roles = ['응용', '시스템 호출', '커널', '드라이버']
times = [2, 1, 3, 4]  # 직렬 단계, ms
print(' → '.join(roles))
print(sum(times), 'ms')
''', '응용 → 시스템 호출 → 커널 → 드라이버\n10 ms', '리스트는 여러 값을 순서대로 담습니다. 역할 목록은 실제 OS를 구현한 코드가 아니라 요청 도식입니다.|join은 목록의 이름을 화살표로 연결합니다.|직렬 단계라는 가정에서 sum으로 시간 2+1+3+4를 더합니다.')

lab('A2', '''
timeline = [('P1', 2), ('P2', 2), ('P1', 2), ('P2', 2)]
p1_time = sum(ms for pid, ms in timeline if pid == 'P1')
print(p1_time, 'ms')
print(sum(ms for pid, ms in timeline), 'ms')
''', '4 ms\n8 ms', '각 튜플은 프로세스 이름과 배정된 CPU 시간을 담습니다.|if로 P1의 두 구간만 선택하여 2+2를 더합니다.|전체 구간 합 8ms와 P1 CPU 시간 4ms는 다른 값입니다.')

lab('A3', '''
free = [0, 1, 2]  # 각 영역의 빈 GiB
print(sum(free), 'GiB')
print(max(free), 'GiB')
''', '3 GiB\n2 GiB', 'sum은 분리된 영역의 빈 공간 합을 구합니다.|max는 표에서 가장 큰 개별 빈 영역을 찾습니다.|합 3GiB가 한 곳의 연속 3GiB 공간을 뜻하지는 않습니다.')

lab('A4', '''
from math import ceil
sizes = [10, 5, 1]  # KiB
block = 4  # KiB, 블록 전체 할당 모형
blocks = [ceil(size / block) for size in sizes]
allocated = sum(blocks) * block
print(blocks)
print(allocated, allocated - sum(sizes))
''', '[3, 2, 1]\n24 8', 'ceil은 나머지가 있는 파일의 블록 수를 올림합니다.|파일마다 계산한 블록 수를 더해 6블록×4KiB=24KiB를 구합니다.|내용 16KiB를 빼면 모형의 내부 남는 공간 합은 8KiB입니다.')

lab('A5', '''
components = {'커널': 3, 'GNU 도구': 4, '패키지 관리자': 2, '설치 도구': 1}
print(list(components))
print(sum(components.values()))
''', "['커널', 'GNU 도구', '패키지 관리자', '설치 도구']\n10", '딕셔너리는 이름(키)과 대응 값의 쌍을 담습니다.|키 목록은 배포판 구성 역할의 구분을 보여 줍니다.|파일 수는 가상 입력이며 실제 배포판 규모를 나타내지 않습니다.')

lab('B1', '''
incoming = 1200  # 건/초
capacity = 1000  # 건/초
seconds = 60
backlog = max(0, incoming - capacity) * seconds
print(backlog, '건')
''', '12000 건', '유입률과 처리률이 같은 단위이고 60초 동안 일정하다는 가정입니다.|초당 200건의 초과 입력이 누적됩니다.|초기 적체가 없고 처리 재시도 등 다른 비용이 없는 단순 모형입니다.')

lab('B2', '''
stages = ['조직 업무', '개인 웹', '참여 플랫폼', '모바일·클라우드', 'AI·엣지']
for order, stage in enumerate(stages, start=1):
    print(order, stage)
''', '1 조직 업무\n2 개인 웹\n3 참여 플랫폼\n4 모바일·클라우드\n5 AI·엣지', 'enumerate는 순서 번호와 값을 함께 읽습니다.|자료 생성 환경이 확대된 교육용 흐름입니다.|이 순서는 이전 기술의 완전 소멸이나 모든 지역의 고정 연표를 뜻하지 않습니다.')

lab('B3', '''
assets = [
    ('GPS CSV', True), ('API JSON', True),
    ('줄거리', False), ('위성 사진', True),
]
print([name for name, has_time in assets if has_time])
print(sum(has_time for name, has_time in assets))
''', "['GPS CSV', 'API JSON', '위성 사진']\n3", '각 자료의 시간 맥락 여부를 True/False로 표시합니다.|if는 시간 맥락이 있는 자료만 선택합니다.|구조가 정형인지와 시간 맥락 여부는 서로 다른 분류입니다.')

lab('C1', '''
edge = {'왕복': 2, '연산': 6}
cloud = {'왕복': 80, '연산': 4}
print(sum(edge.values()), 'ms')
print(sum(cloud.values()), 'ms')
''', '8 ms\n84 ms', '왕복과 연산이 직렬로 더해지는 가상 경로입니다.|클라우드 연산 4ms가 더 짧아도 왕복 지연 때문에 합은 84ms입니다.|전체 병목을 보지 않고 계산 시간 하나만 비교하면 선택이 달라질 수 있습니다.')

lab('C2', '''
paths = {'ETL': ['추출', '변환', '적재'], 'ELT': ['추출', '적재', '변환']}
for name, steps in paths.items():
    print(name, ' → '.join(steps))
print(sum([2, 3]), '재시도')
''', 'ETL 추출 → 변환 → 적재\nELT 추출 → 적재 → 변환\n5 재시도', 'items로 경로 이름과 단계 목록을 함께 읽습니다.|차이는 변환과 적재의 순서입니다.|재시도 합은 이벤트의 고유 건수나 자료량과 다릅니다.')

lab('C3', '''
messages = ['e1', 'e2', 'e2', 'e3']
print(len(messages), '메시지')
print(len(set(messages)), '고유 이벤트')
''', '4 메시지\n3 고유 이벤트', 'len은 목록 원소 수를 셉니다.|set은 같은 값의 반복을 하나로 묶는 집합입니다.|같은 ID가 같은 사건이라는 가정에서 재전송을 한 번만 셉니다.')

lab('C4', '''
from math import ceil
sizes = [300, 128, 64]  # MB, 학습 가정
blocks = [ceil(size / 128) for size in sizes]
print(blocks, sum(blocks))
print(sum(blocks) * 3, '사본')
print(sum(sizes) * 3, 'MB 내용 사본')
''', '[3, 1, 1] 5\n15 사본\n1476 MB 내용 사본', '각 파일에 올림을 적용한 논리 블록 합은 5입니다.|복제 계수 3을 곱하면 목표 사본 수 15입니다.|마지막 블록 내용까지 전체 크기로 채우지 않으며 실제 오버헤드는 제외한 모형입니다.')

lab('C5', '''
model_for = {'키 조회': '키-값', '중첩 항목': '문서', '관계 탐색': '그래프'}
for query, model in model_for.items():
    print(query, '→', model)
''', '키 조회 → 키-값\n중첩 항목 → 문서\n관계 탐색 → 그래프', '조회 목적과 후보 저장 모델을 연결하는 개념 표입니다.|실제 데이터베이스를 구성하거나 성능을 측정한 코드가 아닙니다.|최종 선택에는 갱신·일관성·비용·제품 조건을 함께 확인합니다.')

lab('D1', '''
rows = [('r1', ' Korea ', 20), ('r1', 'Korea', 21),
        ('r2', 'Japan', None), ('r3', 'Korea', 150), ('r4', 'Korea', 22)]
ids = {row[0] for row in rows}
countries = sorted({row[1].strip() for row in rows})
print(len(rows), len(ids))
print(countries)
''', "5 4\n['Japan', 'Korea']", '원시 행 5개와 ID 집합 4개를 나눠 읽습니다.|strip은 나라 문자열의 앞뒤 공백을 제거합니다.|ID 수 확인만으로 충돌 나이나 범위 위반까지 해결된 것은 아닙니다.')

lab('D2', '''
missing = {'a', 'd'}
range_error = {'b'}
reference_error = {'a'}
bad_rows = missing | range_error | reference_error
print(len(missing) + len(range_error) + len(reference_error))
print(sorted(bad_rows), len(bad_rows) / 5 * 100)
''', "4\n['a', 'b', 'd'] 60.0", '첫 합은 규칙 위반 발생 수 4입니다.|집합의 합집합 연산은 겹친 a를 한 번만 남깁니다.|고유 위반 행 3/전체 5를 기준으로 행 위반률은 60%입니다.')

lab('D3', '''
group_sizes = [3, 2, 1]
print(sum(group_sizes), '명')
print(min(group_sizes), '최소 집단')
print(all(size >= 2 for size in group_sizes))
''', '6 명\n1 최소 집단\nFalse', 'sum은 전체 인원, min은 가장 작은 집단 크기를 구합니다.|all은 모든 집단이 조건을 만족하는지 확인합니다.|False는 이 집단 정의에서 k=2 조건 미충족이며 전체 보호 여부를 판정하는 수치는 아닙니다.')

lab('E1', '''
dictionary = {'catalog.rating': '시청 등급', 'ratings.rating': '사용자 평점'}
for field, meaning in dictionary.items():
    print(field, '→', meaning)
''', 'catalog.rating → 시청 등급\nratings.rating → 사용자 평점', '같은 열 이름도 테이블이 다르면 다른 의미를 가집니다.|딕셔너리는 열의 의미를 읽는 작은 데이터 사전입니다.|숫자 평균을 내기 전에 해당 열이 측정 점수인지 확인합니다.')

lab('E2', '''
import pandas as pd
df = pd.DataFrame({'show_id': ['a', 'b'], 'type': ['Movie', 'TV Show']})
work = df.copy()
print(df.shape)
print(work['type'].tolist())
''', "(2, 2)\n['Movie', 'TV Show']", 'DataFrame의 딕셔너리 키는 열 이름이고 목록은 각 열의 값입니다.|shape는 행 수·열 수 순서의 튜플입니다.|대괄호로 type 열을 선택하고 tolist로 값 목록을 읽습니다.', 'Pandas 표 변환')

lab('F1', '''
import pandas as pd
df = pd.DataFrame({'show_id': ['a','b','c','d','e'],
    'director': ['Kim',None,None,'Lee','Park'],
    'date_added': ['2020-01-01','2020-01-02',None,'2020-02-01','2020-02-02'],
    'rating': ['R','PG','R',None,'PG']})
clean = df.copy()
clean['director'] = clean['director'].fillna('Unknown')
clean = clean.dropna(subset=['date_added', 'rating'])
print(clean['show_id'].tolist())
print(clean['director'].tolist())
print(len(df), len(clean))
''', "['a', 'b', 'e']\n['Kim', 'Unknown', 'Park']\n5 3", 'fillna는 지정 열의 값만 대체하고 행 수를 유지합니다.|dropna는 날짜나 등급이 비어 있는 c·d를 제거합니다.|남은 b의 감독은 실명이 아니라 표시 문자열이며 원시 N=5, 최종 N=3입니다.', 'Pandas 표 변환')

lab('F2', '''
import pandas as pd
df = pd.DataFrame({'date_added': [' 2020-02-01 ', 'bad date'],
                   'duration': ['90 min', '2 Seasons']})
dates = pd.to_datetime(df['date_added'].str.strip(), errors='coerce')
parts = df['duration'].str.split()
print(int(dates.iloc[0].year), int(dates.isna().sum()))
print([int(p[0]) for p in parts], [p[1].rstrip('s') for p in parts])
''', "2020 1\n[90, 2] ['min', 'Season']", '날짜 공백을 없앤 후 변환 실패 한 건을 결측으로 확인합니다.|split 결과의 첫 조각을 숫자로, 두 번째 조각을 단위로 읽습니다.|여기의 rstrip은 예시 단위의 마지막 복수형 s를 정리하며 숫자 90과 2의 단위를 합치지 않습니다.', 'Pandas 표 변환')

lab('F3', '''
import pandas as pd
df = pd.DataFrame({'show_id': ['a','b','c','d'],
    'listed_in': ['Drama, Comedy','Drama','Comedy, Action','Drama, Action, Comedy']})
long = df.assign(genre=df['listed_in'].str.split(', ')).explode('genre')
print(len(df), len(long), long['show_id'].nunique())
print(long['genre'].value_counts().sort_index().to_dict())
''', "4 8 4\n{'Action': 2, 'Comedy': 3, 'Drama': 3}", 'assign은 목록을 담은 새 genre 열을 만듭니다.|explode는 목록을 펼쳐 작품×장르 관계 8행으로 바꿉니다.|고유 ID는 여전히 4이며 빈도 합 8은 관계 수입니다.', 'Pandas 표 변환')

lab('G1', '''
import pandas as pd
s = pd.Series([60, 80, 90, 100, 110, 120, 200])
q1, q3 = s.quantile([0.25, 0.75], interpolation='linear')
iqr = q3 - q1
print(float(s.median()), float(q1), float(q3))
print(float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr))
print(s[s > q3 + 1.5 * iqr].tolist())
''', '100.0 85.0 115.0\n40.0 160.0\n[200]', '선형 보간을 명시하여 Q1=85, Q3=115를 구합니다.|IQR=30으로 경계 40·160을 계산합니다.|200은 경계 바깥 관측이며 입력 오류 여부는 추가 검토가 필요합니다.', 'Pandas 표 변환')

lab('G2', '''
registered = [120, 144, 45]
months = [12, 12, 3]
print([count / n for count, n in zip(registered, months)])
released = [2010, 2018, 2020, 2015]
added = [2020, 2020, 2020, 2021]
gaps = [y - x for x, y in zip(released, added)]
print(gaps, sum(gaps) / len(gaps))
''', '[10.0, 12.0, 15.0]\n[10, 2, 0, 6] 4.5', 'zip은 같은 위치의 두 값을 짝지어 읽습니다.|월평균의 분모는 각 연도의 실제 관측 월 수입니다.|등록−제작 연도 차이 평균은 4.5년이며 정확한 일수 지연은 아닙니다.')

lab('G3', '''
cell = 6
drama_total = 6 + 3 + 1
ma_total = 6 + 2 + 3
all_total = 10 + 10 + 5
print(round(cell / drama_total * 100, 2))
print(round(cell / ma_total * 100, 2))
print(round(cell / all_total * 100, 2))
''', '60.0\n54.55\n24.0', '같은 셀 6을 Drama 행 안의 비율로 읽으면 분모 10입니다.|TV-MA 열 안의 비율은 분모 11입니다.|전체 조합 비율은 분모 25이며 모두 서로 다른 질문의 답입니다.')

lab('H1', '''
rows = [('D1','A1'), ('D1','A2'), ('D1','A2'), ('D1','A3'), ('D2','A2')]
edges = set(rows)
nodes = {('director', d) for d, a in edges} | {('actor', a) for d, a in edges}
neighbors = {a for d, a in edges if d == 'D1'}
print(len(rows), len(edges), len(nodes))
print(sorted(neighbors), len(neighbors) / (len(nodes) - 1))
''', "5 4 5\n['A1', 'A2', 'A3'] 0.75", '반복 D1–A2를 집합으로 묶어 고유 엣지 4를 얻습니다.|역할을 포함한 노드 집합은 감독 2+배우 3=5입니다.|D1 고유 이웃 3을 전체 N−1=4로 나누는 기준입니다.')

lab('H2', '''
from collections import Counter
text = 'The family and family love crime'
stop = {'the', 'and'}
tokens = text.lower().split()
kept = [word for word in tokens if word not in stop]
print(len(tokens), len(kept))
print(dict(sorted(Counter(kept).items())))
''', "6 4\n{'crime': 1, 'family': 2, 'love': 1}", '소문자화와 공백 토큰화로 같은 family 표기를 묶습니다.|불용어 the와 and 두 토큰을 제외합니다.|고유 단어별 빈도와 토큰 합을 구분하며 실제 감정은 이 코드에서 분석하지 않습니다.')

lab('H3', '''
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
texts = ['family love', 'family crime', 'space robot']
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)
scores = cosine_similarity(X[0:1], X).ravel()
print(vectorizer.get_feature_names_out().tolist())
print([round(float(s), 3) for s in scores])
ratings = pd.DataFrame({'A': [1, 2, 3, None], 'B': [2, 4, 6, 2]})
print(float(ratings.corr(min_periods=2).loc['A', 'B']))
''', "['crime', 'family', 'love', 'robot', 'space']\n[1.0, 0.366, 0.0]\n1.0", '동일한 어휘·IDF로 세 문서를 수치 벡터로 변환합니다.|대상 문서 자신과의 유사도 1도 포함되므로 추천에는 ID 제외가 필요합니다.|평점 A·B의 공통 세 사용자에서 Pearson 1이며 동일 평점이라는 뜻은 아닙니다.', 'TF-IDF·상관 실습')

lab('H4', '''
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
train_text = ['old family drama', 'old crime drama', 'new space robot', 'new space comedy']
train_year = [2000, 2002, 2018, 2020]
test_text = ['old family', 'new space']
test_year = [2001, 2019]
model = make_pipeline(TfidfVectorizer(), Ridge(alpha=1.0, solver='lsqr'))
model.fit(train_text, train_year)
pred = model.predict(test_text)
print([round(float(v), 1) for v in pred])
print(round(float(mean_absolute_error(test_year, pred)), 2), '년')
print(mean_absolute_error([2010, 2015, 2020, 2018], [2012, 2014, 2017, 2018]))
''', '[2005.5, 2015.2]\n4.12 년\n1.5', '학습 네 작품과 테스트 두 작품을 명시적으로 분리한 가상 자료입니다.|Pipeline의 fit은 학습 텍스트의 TF-IDF와 Ridge를 함께 학습하고 predict는 같은 기준으로 테스트를 변환합니다.|예측 표시는 소수 첫째 자리로 반올림하지만 MAE는 반올림 전 pred로 계산합니다. 작은 가상 예제 성능은 실제 카탈로그 성능을 뜻하지 않으며 마지막 출력은 C36의 MAE 1.5입니다.', 'Ridge 학습·평가 실습')
