"""계산 규칙 엔진을 재사용하지 않고 Pandas/NumPy로 사례의 답·출력을 검산한다."""
from pathlib import Path
import json, math, sys
import pandas as pd
import numpy as np
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[1]
cases={c['id']:c for c in json.loads((root/'src/content/cases.json').read_text(encoding='utf-8'))}
qs=json.loads((root/'src/content/questions.json').read_text(encoding='utf-8'))
dfs={k:pd.DataFrame(c['rows']) for k,c in cases.items()}
# 각 문항의 상황을 독립적인 식으로 옮긴다. JSON calculation은 읽지 않는다.
f=dfs
expected={
'C01':f['C01']['시간_ms'].sum(),
'C02':f['C02'].query('프로세스 == "P1"')['시간_ms'].sum(),
'C03':f['C03']['빈_GiB'].sum(),
'C04':sum(math.ceil(n/4)*4 for n in f['C04']['크기_KiB']),
'C05':(f['C05'].iloc[1]['유입_건초']-f['C05'].iloc[1]['처리_건초'])*60,
'C06':f['C06']['시간'].eq('있음').sum(),
'C07':f['C07'].iloc[1]['합계_ms'],
'C08':f['C08']['재시도_건'].sum(),
'C09':f['C09']['event_id'].nunique(),
'C10':sum(math.ceil(n/128) for n in f['C10']['크기_MB']),
'C11':f['C11']['조회_천건초'].sum(),
'C12':len(f['C12'].drop_duplicates('id')),
'C13':f['C13']['결측'].sum(),
'C14':f['C14']['인원'].sum(),
'C15':f['C15'].iloc[3]['유효값수'],
'C16':f['C16']['결과행수'].sum(),
'C17':f['C17']['show_id'].nunique(),
'C18':f['C18']['director'].isna().sum(),
'C19':f['C19'].query('type == "TV Show"')['value'].mean(),
'C20':len(f['C20'].assign(listed_in=lambda d:d.listed_in.str.split(', ')).explode('listed_in')),
'C21':len(f['C21'].assign(country=lambda d:d.country.str.split(', '),genre=lambda d:d.genre.str.split(', ')).explode('country').explode('genre')),
'C22':sum(len([a for a in str(s).split(', ') if a!='Unknown']) for s in f['C22']['cast']),
'C23':(f['C23']['added_year']-f['C23']['release_year']).mean(),
'C24':f['C24'].set_index('type').loc['Movie','count']/f['C24']['count'].sum()*100,
'C25':f['C25']['빈도'].sum(),
'C26':f['C26']['분'].median(),
'C27':f['C27'].iloc[2]['등록수']/f['C27'].iloc[2]['관측개월'],
'C28':f['C28']['3월'].sum(),
'C29':f['C29'].iloc[0]['TV-MA']/f['C29'].iloc[0][['TV-MA','TV-14','TV-PG']].sum()*100,
'C30':f['C30'].iloc[1]['Drama']/f['C30'].iloc[1][['Drama','Comedy']].sum()*100,
'C31':f['C31']['투자_십억달러'].sum(),
'C32':f['C32'].query('감독 == "D1"')['배우'].nunique()/(len(set(f['C32']['감독'])|set(f['C32']['배우']))-1),
'C33':f['C33']['count'].sum(),
'C34':f['C34'].query('seen == "아니오"')['similarity'].mean(),
'C35':len(f['C35'].dropna(subset=['A','B'])),
'C36':np.abs(f['C36']['actual']-f['C36']['predicted']).mean(),
'C37':f['C37'].iloc[0]['테스트수']/f['C37'].iloc[0][['학습수','테스트수']].sum()*100,
'C38':f['C38']['파일수'].sum(),
'C39':len(f['C39'])}
numeric=[]
for q in qs:
 if q['kind']!='numeric':continue
 actual=float(expected[q['caseId']]);assert math.isclose(actual,q['numeric']['value'],abs_tol=1e-10),q['id']
 numeric.append(f"| {q['id']} | {actual:g} | {q['numeric']['unit']} | PASS |")
# 표에 있는 처리·해석 문항도 실제 출력으로 확인한다.
clean=f['C18'].copy();clean['director']=clean.director.fillna('Unknown');clean=clean.dropna(subset=['date_added','rating'])
assert clean.show_id.tolist()==['a','b','e'] and clean.director.ne('Unknown').sum()==2
genres=f['C20'].assign(genre=lambda d:d.listed_in.str.split(', ')).explode('genre')
assert genres.genre.value_counts().to_dict()=={'Drama':3,'Comedy':3,'Action':2}
assert genres.show_id.nunique()==4
assert np.quantile(f['C26']['분'],[.25,.5,.75]).tolist()==[85,100,115]
assert f['C34'].query('seen == "아니오"').sort_values(['similarity','id'],ascending=[False,True]).id.tolist()==['B','C','D']
corr=f['C35'].set_index('user').corr(method='pearson',min_periods=2)
assert math.isclose(corr.loc['A','B'],1) and math.isclose(corr.loc['A','C'],-1) and corr['신규'].isna().all()
# 원문 9개 교육용 평점의 'Inception=1.0' 설명은 재현되지 않는다.
original=pd.DataFrame({'user':['A','A','B','B','C','C','C','D','D'],
 'title':['The Matrix','V for Vendetta','Sextuplets','The Hangover','The Matrix','Inception','V for Vendetta','Sextuplets','Just Go with It'],
 'rating':[5,4,5,4,5,5,5,4,5]})
original_sim=original.pivot(index='user',columns='title',values='rating').corr(min_periods=2)
assert original_sim['Inception'].isna().all() and original_sim['The Matrix'].isna().all()
code_results=[('C18','fillna + dropna','a,b,e 3행 / 알려진 감독 2행'),('C20','split + explode + value_counts','8관계 / 4작품 / Drama 3,Comedy 3,Action 2'),('C21','country·listed_in 순차 explode','7 국가×장르 관계'),('C26','NumPy linear quantile','Q1 85 / 중앙값 100 / Q3 115 / IQR 30'),('C32','고유 엣지·이웃 집합','레코드 5 / 엣지 4 / 노드 5 / D1 중심성 0.75'),('C34','후보 필터 + 안정적 동점 정렬','B,C,D'),('C35','Pandas corr(min_periods=2)','A-B 1 / A-C -1 / 신규 NaN'),('원문 p60~62','9평점 pivot + corr','Matrix 상수, Inception 1관측 → Pearson NaN'),('C36','NumPy absolute error mean','MAE 1.5년')]
report=f"""# 정답·코드 출력 검증

실행일: 2026-10-12. Python {sys.version.split()[0]}, Pandas {pd.__version__}, NumPy {np.__version__}.

`python scripts/verify_answers.py`는 앱의 calculation 구현을 호출하지 않고, 공개된 합성 사례 표를 Pandas/NumPy의 독립적인 식으로 검산한다. 숫자 정답 39개 모두 PASS. `npm run validate`는 앱 계산 규칙과 정답도 별도로 비교한다.

| 문항 | 계산값 | 단위 | 결과 |
|---|---:|---|---|
"""+'\n'.join(numeric)+"\n\n| 자료 | 실행한 연산 | 확인 출력 |\n|---|---|---|\n"+'\n'.join(f'| {a} | {b} | {c} |' for a,b,c in code_results)+"""

원본 CSV는 다운로드하거나 실행하지 않았다. 실제 넷플릭스 카탈로그의 통계 재현을 주장하지 않는다. 모든 사례 수치는 학습용 가상 데이터이며 원문은 개념 범위와 해석 주의점의 근거다.

117개 객관식은 정답 ID 1개와 4개 선지·각 이유를 구조 검사하고 사례 해설과 수작업으로 대조했다. 인프라·보안·인과 해석 같은 문장의 진위를 수치 테스트만으로 증명하지는 않는다. 15개 짧은 답은 지정 용어의 허용 목록, 24개 서술은 공개한 모범 답안·채점 요소로 자기 평가한다. 서술 문장을 외부 AI로 자동 채점하지 않는다.

오해 점검: 부분 연도( C27), 집단별 분모(C29/C30), 관계 행≠작품(C20/C21/C22), 시청 등급≠사용자 평점(C15/C35), 카탈로그≠인기(C24), 이중 축≠투자 효과(C31), 극단값≠오류(C26), 빈도≠감정(C33), 누수 없는 train fit/test transform(C37).
"""
(root/'docs/answer-validation.md').write_text(report,encoding='utf-8')
print('PASS: 39 independent numeric answers + 9 output checks')
