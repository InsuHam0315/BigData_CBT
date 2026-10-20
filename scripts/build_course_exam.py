"""Build five mixed exams from four handouts; preserve all previous exam IDs."""
import json,random
from pathlib import Path
from collections import Counter
from course_questions import environment,bigdata,infrastructure,netflix
from course_questions.concept_revision import apply

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'src/content/course'

def build():
 OUT.mkdir(parents=True,exist_ok=True)
 handouts=json.loads((ROOT/'src/content/handouts.json').read_text(encoding='utf-8'))
 notebook=json.loads((ROOT/'src/content/notebook.json').read_text(encoding='utf-8'))['documents']
 figures=json.loads((ROOT/'src/content/source-figures.json').read_text(encoding='utf-8'))
 figmap={f['id']:f for f in figures}
 sources=[];topics=[];lessons=[];cases=[];questions=[];rounds=[];reviews=[]
 for i,(h,n) in enumerate(zip(handouts,notebook,strict=True),1):
  topic=f'P{i}';lid=f'PN{i}';sid='HANDOUT_'+h['id'];title=f'{i}. {h["title"]}'
  sources.append(dict(id=sid,filename=h['filename'],role='primary',pages=h['pages'],handoutId=h['id']))
  topics.append(dict(id=topic,title=title,subtitle='PDF 전체 학습 내용'))
  sections=[dict(heading=c['title'],body=[p['term']+': '+p['meaning'] for p in c['points']],source=dict(sourceId=sid,pages=sorted({p for s in n['sections'] if s['id'] in c['sectionIds'] for p in s['pages']}))) for c in n['chapters']]
  lessons.append(dict(id=lid,topic=topic,title=title,minutes=h['pages'],intro=h['description'],prerequisiteIds=[],walkthrough=[],workedExamples=[],codeKind='diagram',selfChecks=[],keyPoints=[s['heading'] for s in sections],tags=['전체 PDF','핵심 필기'],objectives=['원본 내용과 도표를 읽고 종합 문제에 적용한다.'],sections=sections,additionalSections=[],corrections=[],terms=[],code='',codeNotes=[],readOrder=[],mistakes=[],check=dict(question='어떤 자료인가?',answer=h['title']),caseIds=[f'PC{i}'],sources=[dict(sourceId=sid,pages=list(range(1,h['pages']+1)))],supplements=[]))
  cases.append(dict(id=f'PC{i}',topic=topic,title=title,scenario='문항 상황은 직접 작성했으며 연결한 그림은 PDF 원본 캡처입니다.',unit='문항',validN=0,exclusions='문항의 집계 조건을 따릅니다.',assumptions=[],synthetic=True,numericOrigin='원문 수치와 학습용 조건은 문항에서 구분합니다.',columns=[],rows=[],code='',codeNotes=[],guide=[],lessonId=lid,sources=[dict(sourceId=sid,pages=list(range(1,h['pages']+1)))],supplements=[],questionIds=[]))
 modules=[environment,bigdata,infrastructure,netflix]
 revised_groups=apply(modules)
 assert [len(m.GROUPS) for m in modules]==[10,6,10,14]
 for round_index in range(5):
  rng=random.Random(20261021+round_index);items=[]
  for di,module in enumerate(modules):
   for group in revised_groups[di]:
    v=group['variants'][round_index];h=handouts[di];chapter=notebook[di]['chapters'][(v.get('chapter') or group['chapter'])-1]
    figure=v.get('figure') or group['figure']
    if group['key']=='goals' and round_index==0:figure='nf-types'
    if group['key']=='eda' and round_index==3:figure='nf-monthly'
    pages=sorted(set(v.get('pages') or group['pages'])|({figmap[figure]['page']} if figure else set()))
    highlights=[f'{h["id"]}-p{m.split("-")[0]}-a{m.split("-")[1]}' for m in group['marks']]
    options=v.get('options') or group['options'];answer=v['answer']
    assert len(options)==4 and answer in range(4)
    items.append(dict(documentId=h['id'],topic=f'P{di+1}',kind='choice',difficulty=group['difficulty'],skill=group['skill'],mistake='그래프 읽기' if group['skill']=='그래프 해석' else '코드' if group['skill']=='코드 읽기' else '개념',stem=v['stem'],options=options,answer=answer,explanation=v['explanation'],steps=[v['explanation']],commonError='정의한 관찰 대상·단위·조건을 다른 것으로 바꾸어 해석하지 않습니다.',lessonId=f'PN{di+1}',caseId=f'PC{di+1}',sources=[dict(sourceId='HANDOUT_'+h['id'],pages=pages)],highlightIds=highlights,notebookChapterId=chapter['id'],figureIds=[figure] if figure else [],exhibit=v.get('exhibit'),origin='개념 이해·적용을 위한 직접 작성 예상문제',concept=group['key'],reviewDecision=v['reviewDecision'],reviewKey=v['reviewKey']))
  # Mix documents throughout each round instead of presenting unit blocks.
  for attempt in range(100):
   rng.shuffle(items)
   if all(len({q['topic'] for q in items[j:j+4]})>1 for j in range(37)):break
  positions=[p for p in range(4) for _ in range(10)];rng.shuffle(positions)
  ids=[]
  for j,q in enumerate(items):
   q['id']=f'C26V2R{round_index+1:02}Q{j+1:02}';options=q.pop('options');correct=q.pop('answer');distractors=[i for i in range(4) if i!=correct];rng.shuffle(distractors);order=distractors[:];order.insert(positions[j],correct)
   reviews.append(dict(id=q['id'],previousId=f'C26R{round_index+1:02}Q{j+1:02}',key=q.pop('reviewKey'),decision=q.pop('reviewDecision'),checks=['concept-in-source','self-contained-givens','one-correct-answer','explanation-and-distractors'],stem=q['stem']))
   q['choices']=[dict(id=f'{q["id"]}-{k+1}',text=options[o][0],reason=(q['explanation'] if o==correct else options[o][1]+' 이번 상황의 판단: '+q['explanation'])) for k,o in enumerate(order)]
   q['correctId']=q['choices'][positions[j]]['id'];ids.append(q['id']);questions.append(q);cases[int(q['topic'][1])-1]['questionIds'].append(q['id'])
  assert len(items)==40 and sum(bool(q['highlightIds']) for q in items)==25
  assert Counter(q['difficulty'] for q in items)=={'중하':32,'중':6,'상':2}
  rounds.append(dict(id=f'course-{round_index+1}',title=f'종합 모의고사 {round_index+1}회차',description='PDF 4개 전체 · 개념 이해·적용 개정판 · 강조 개념 25문항 + 일반 15문항',caseIds=[f'PC{i}' for i in range(1,5)],questionIds=ids,defaultCount=40,defaultMinutes=60))
 assert len({q['stem'] for q in questions})==200
 assert {q['notebookChapterId'] for q in questions}=={c['id'] for d in notebook for c in d['chapters']}
 meta=dict(edition='2026-10-21-concept-v2',documents=4,pages=169,rounds=5,questionsPerRound=40,emphasizedPerRound=25,emphasizedPercent=62.5,sourceFiles=[dict(id=h['id'],sha256=h['sha256'],pages=h['pages']) for h in handouts],difficulty={'중하':32,'중':6,'상':2},documentCounts={'environment':10,'bigdata':6,'infrastructure':10,'netflix':14})
 for name,data in dict(sources=sources,topics=topics,lessons=lessons,cases=cases,questions=questions,blueprints=rounds,meta=meta).items():(OUT/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 report=dict(edition=meta['edition'],reviewed=len(reviews),decisions=dict(Counter(r['decision'] for r in reviews)),questionsWithExhibits=sum(bool(q.get('exhibit')) for q in questions),questionsWithFigures=sum(bool(q['figureIds']) for q in questions),items=reviews)
 (ROOT/'docs/course-concept-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Course exams: 5 x 40, 25 highlighted each, 22 chapters, 4 documents')

if __name__=='__main__':build()
