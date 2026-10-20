import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {courseQuestions,courseBlueprints,questionMap,finalQuestions,archivedCourseQuestions,allQuestions,reviewQuestions} from '../src/content';
import review from '../docs/course-concept-review.json';
import {newDraft,roundQuestions,grade,selectQuestions} from '../src/engine';
import {getProfile,readLesson,updateProfile,submitDraft,exportBackup,importBackup,toggleBookmark} from '../src/storage';

describe('full four-PDF examinations',()=>{
 it('mixes four documents with actual highlighted concepts in every round',()=>{
  const all=new Set<string>();
  for(const r of courseBlueprints){const qs=roundQuestions(r).map(id=>questionMap[id]);expect(qs).toHaveLength(40);expect(new Set(qs.map(q=>q.documentId)).size).toBe(4);expect(qs.filter(q=>q.highlightIds?.length)).toHaveLength(25);for(const q of qs){expect(all.has(q.id)).toBe(false);all.add(q.id);expect(grade(q,q.correctId)).toBe(true);for(const c of q.choices!.filter(c=>c.id!==q.correctId))expect(grade(q,c.id)).toBe(false);}}
  expect(all.size).toBe(200);expect(courseQuestions.some(q=>finalQuestions.some(f=>f.id===q.id))).toBe(false);
 });
 it('keeps ten answers in each position before/after shuffle and the restored order',()=>{
  for(const r of courseBlueprints)for(const mixed of [false,true])for(let n=0;n<12;n++){
   const draft=newDraft('course-shuffle','exam',r.title,roundQuestions(r),60,mixed),counts=[0,0,0,0];
   for(const id of draft.questionIds){const q=questionMap[id];expect(new Set(draft.choiceOrders[id])).toEqual(new Set(q.choices!.map(c=>c.id)));counts[draft.choiceOrders[id].indexOf(q.correctId!)]++;}
   expect(counts).toEqual([10,10,10,10]);expect(JSON.parse(JSON.stringify(draft)).choiceOrders).toEqual(draft.choiceOrders);
  }
 });
 it('independently checks source example arithmetic and the distinction of sample/full-test MAE',()=>{
  const sampleMAE=[Math.abs(2017-2014),Math.abs(2017-2016),Math.abs(2019-2017),Math.abs(2014-2013)].reduce((a,b)=>a+b)/4;
  const expected=[sampleMAE.toFixed(2)+'년',(6.22-4.83).toFixed(2)+'년',`${(Math.abs(3)+Math.abs(-3))/2}년`,'평가 범위가 다르므로 두 평균은 다를 수 있다',((6.22-4.83)/6.22*100).toFixed(1)+'%'];
  for(let i=0;i<5;i++){const q=courseQuestions.find(q=>q.id.startsWith(`C26V2R0${i+1}`)&&q.concept==='mae')!;expect(q.choices!.find(c=>c.id===q.correctId)!.text).toBe(expected[i]);}
 });
 it('supplies all numerical givens and independently checks application answers',()=>{
  const item=(document:string,concept:string,round:number)=>courseBlueprints[round-1].questionIds!.map(id=>questionMap[id]).find(q=>q.documentId===document&&q.concept===concept)!;
  const answer=(document:string,concept:string,round:number)=>{const q=item(document,concept,round);return q.choices!.find(c=>c.id===q.correctId)!.text;};
  const blocks=Math.ceil(300/128);
  expect(answer('infrastructure','hdfs',4)).toBe(`논리 블록 ${blocks}개 · 사본 ${blocks*3}개`);
  expect(item('infrastructure','hdfs',4).stem).toMatch(/300 MiB.*128 MiB.*3/);
  expect(answer('infrastructure','privacy',2)).toBe(String(Math.min(3,5,2)));
  expect(item('infrastructure','privacy',2).exhibit!.rows.map(row=>Number(row[2]))).toEqual([3,5,2]);
  expect(answer('netflix','preprocess',5)).toBe(`${100-(8+5-3)}행`);
  expect(answer('netflix','eda',3)).toBe(`A=${['A','B','A','C'].filter(a=>a==='A').length}회 · 관계 행=${2+2}개`);
  expect(answer('netflix','eda',5)).toBe(`관계 합은 ${2+1}, 고유 작품은 ${new Set(['a','a','b']).size}다`);
  expect(answer('netflix','relations',3)).toBe(`A=${20/100*100}% · B=${30/50*100}%`);
  expect(answer('netflix','relations',4)).toBe(`20/(20+30)=${20/50*100}%`);
  expect(answer('netflix','othercharts',1)).toBe(`${110-80}분 · 가운데 50%의 범위 폭`);
  expect(answer('netflix','histogram',4)).toBe(`첫 구간 ${[2005,2010,2019].filter(y=>y>=2000&&y<2010).length}개 · 둘째 구간 ${[2005,2010,2019].filter(y=>y>=2010&&y<2020).length}개`);
  // Correlation requires both paired observations and nonzero variance.
  const common=item('netflix','collaborative',2).exhibit!.rows.filter(row=>row[1]!=='미평가'&&row[2]!=='미평가');
  expect(common).toHaveLength(1);
  const constant=item('netflix','collaborative',1).exhibit!.rows.map(row=>Number(row[1]));
  expect(new Set(constant).size).toBe(1);
  expect(item('netflix','regression',1).exhibit!.code).toContain('fit_transform(all_text)');
  expect(answer('netflix','regression',1)).toContain('분리 후 훈련으로 fit');
 });
 it('audits all 200 active items for concept questions instead of PDF recall',()=>{
  expect(review.reviewed).toBe(200);
  expect(review.items.map(x=>x.id).sort()).toEqual(courseQuestions.map(q=>q.id).sort());
  for(const row of review.items){
   const q=questionMap[row.id],old=questionMap[row.previousId];
   expect(q.id).toMatch(/^C26V2R0[1-5]Q\d{2}$/);
   expect(q.documentId).toBe(old.documentId);expect(q.concept).toBe(old.concept);
   expect(q.highlightIds).toEqual(old.highlightIds);
   expect(q.stem).not.toMatch(/PDF|교수님|수업|원문|p\d+|쪽수|몇 쪽|표시한 전체 테스트 결과/);
   expect(q.steps.join(' ')).not.toMatch(/원문 정의와 비교|원본 그림의 관찰 대상/);
   if(q.exhibit)for(const row of q.exhibit.rows)expect(row.length).toBe(q.exhibit.columns.length);
   if(row.decision==='rewritten')expect(q.stem).not.toBe(old.stem);
  }
 });
 it('keeps old course questions and keys immutable and out of fresh practice',()=>{
  expect(archivedCourseQuestions).toHaveLength(200);
  expect(createHash('sha256').update(JSON.stringify(archivedCourseQuestions)).digest('hex')).toBe('2e197848dc43bb870af228497f21b0ca50a5d298a1e7aea50e6a5f74c921da2b');
  for(const q of archivedCourseQuestions){
   expect(questionMap[q.id]).toBe(q);expect(allQuestions.some(x=>x.id===q.id)).toBe(false);
   expect(reviewQuestions.some(x=>x.id===q.id)).toBe(true);
  }
  expect(courseBlueprints.flatMap(r=>r.questionIds!)).not.toContain('C26R01Q01');
  const mixed=[questionMap.C26R01Q01,courseQuestions[0],questionMap.F01Q21];
  expect(new Set(selectQuestions({pool:mixed,count:3,random:false}).ids)).toEqual(new Set(mixed.map(q=>q.id)));
  expect(new Set(selectQuestions({pool:archivedCourseQuestions,count:200,random:false}).ids)).toEqual(new Set(archivedCourseQuestions.map(q=>q.id)));
 });
 it('restores a pre-revision course draft with the original grading and choice order',async()=>{
  const owner='course-v1-owner',target='course-v1-restored',ids=['C26R01Q01','C26R01Q02'];
  const d=newDraft(owner,'practice','PDF 4개 · 개정 전 저장 기록',ids,60,true);
  d.answers[ids[0]]=questionMap[ids[0]].correctId!;
  d.answers[ids[1]]=questionMap[ids[1]].choices!.find(c=>c.id!==questionMap[ids[1]].correctId)!.id;
  await updateProfile(owner,p=>{p.draft=d;});await toggleBookmark(owner,ids[1],'question');
  await importBackup(target,exportBackup(await getProfile(owner)),'replace');
  const restored=await getProfile(target);
  expect(restored.draft!.questionIds).toEqual(ids);expect(restored.draft!.choiceOrders).toEqual(d.choiceOrders);
  await submitDraft(target,restored.draft!.id);
  const submitted=await getProfile(target);
  expect(submitted.attempts[0].correct).toBe(1);expect(submitted.attempts[0].total).toBe(2);
  expect(submitted.wrongNotes[0].questionId).toBe(ids[1]);
  expect(submitted.bookmarks.some(b=>b.targetId===ids[1])).toBe(true);
 });
 it('backs up new progress, answered results, wrong notes and bookmarks alongside old history',async()=>{
  const owner='course-backup-fixture',ids=roundQuestions(courseBlueprints[0]);await readLesson(owner,'A2',true);await readLesson(owner,'FN3',true);await readLesson(owner,'PN4',true);
  const draft=newDraft(owner,'exam','full course fixture',ids,60,true);draft.answers[ids[0]]=questionMap[ids[0]].correctId!;draft.answers[ids[1]]=questionMap[ids[1]].choices!.find(c=>c.id!==questionMap[ids[1]].correctId)!.id;
  await updateProfile(owner,p=>{p.draft=draft;});await submitDraft(owner,draft.id);await toggleBookmark(owner,ids[1],'question');
  const before=await getProfile(owner);const backup=exportBackup(before);await importBackup('course-import-fixture',backup,'replace');const restored=await getProfile('course-import-fixture');
  expect(restored.progress.map(p=>p.lessonId)).toEqual(['A2','FN3','PN4']);expect(restored.attempts.at(-1)?.correct).toBe(1);expect(restored.attempts.at(-1)?.total).toBe(40);expect(restored.wrongNotes.some(w=>w.questionId===ids[1])).toBe(true);expect(restored.bookmarks.some(b=>b.targetId===ids[1])).toBe(true);expect(restored.attempts.every(a=>a.userId==='course-import-fixture')).toBe(true);
 });
});
