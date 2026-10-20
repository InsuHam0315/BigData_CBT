import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {finalBlueprints, finalQuestions, finalLessons, questionMap, lessonMap, finalTopics, questions,archivedFinalQuestions,allQuestions,reviewQuestions} from '../src/content';
import {newDraft, roundQuestions, grade, selectQuestions} from '../src/engine';
import {readLesson,updateProfile,patchDraft,getProfile,exportBackup,validateBackup,importBackup,submitDraft,toggleBookmark} from '../src/storage';

describe('final PDF scope and examination specification',()=>{
 it('covers every source page with three continuous chapters and 200 distinct items',()=>{
  expect(finalLessons).toHaveLength(3);
  expect([...new Set(finalLessons.flatMap(l=>l.sections.flatMap(s=>s.source.pages)))].sort((a,b)=>a-b)).toEqual(Array.from({length:19},(_,i)=>i+1));
  expect(finalQuestions).toHaveLength(200);
  expect(new Set(finalQuestions.map(q=>q.id)).size).toBe(200);
  expect(new Set(finalQuestions.map(q=>q.stem)).size).toBe(200);
  for(const q of finalQuestions){
   expect(q.kind).toBe('choice');expect(q.choices).toHaveLength(4);
   expect(new Set(q.choices!.map(c=>c.text)).size).toBe(4);
   expect(lessonMap[q.lessonId].topic).toBe(q.topic);
   expect(q.choices!.filter(c=>c.id===q.correctId)).toHaveLength(1);
   expect(q.sources.every(s=>s.sourceId==='FINAL19'&&s.pages.every(p=>p>=1&&p<=19))).toBe(true);
   expect(q.explanation.length).toBeGreaterThan(25);
   expect(grade(q,q.correctId)).toBe(true);
   expect(grade(q,'1')).toBe(false);
  }
 });
 it('keeps 40 items, difficulty 32/6/2, and ten answers in each position per round',()=>{
  const seen=new Set<string>();
  for(const r of finalBlueprints){
   const qs=roundQuestions(r).map(id=>questionMap[id]);
   expect(qs).toHaveLength(40);
   expect(qs.filter(q=>q.difficulty==='중하')).toHaveLength(32);
   expect(qs.filter(q=>q.difficulty==='중')).toHaveLength(6);
   expect(qs.filter(q=>q.difficulty==='상')).toHaveLength(2);
   for(const t of finalTopics)expect(qs.some(q=>q.topic===t.id)).toBe(true);
   for(const q of qs){expect(seen.has(q.id)).toBe(false);seen.add(q.id);}
   for(const mix of [false,true])for(let attempt=0;attempt<20;attempt++){
    const d=newDraft('final-test','exam',r.title,roundQuestions(r),60,mix);
    const positions=[0,0,0,0];
    for(const q of qs){const order=d.choiceOrders[q.id];expect(new Set(order)).toEqual(new Set(q.choices!.map(c=>c.id)));positions[order.indexOf(q.correctId!)]++;}
    expect(positions).toEqual([10,10,10,10]);
   }
   // Style guard, not a psychometric guarantee: correct options must not dominate length.
   const onlyLongest=qs.filter(q=>{const correct=q.choices!.find(c=>c.id===q.correctId)!;return q.choices!.filter(c=>c!==correct).every(c=>c.text.length<correct.text.length);});
   expect(onlyLongest.length).toBeLessThanOrEqual(10);
  }
  expect(seen.size).toBe(200);
 });
 it('independently verifies the numerical applications and denominator keys',()=>{
  const expected:Record<string,string>={F01Q30:`${114-86}분`,F01Q34:`${(1200-900)*10*60}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')+'건',F01Q35:`${9/2}배`,F01Q36:`${7787-2389}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')+'건',F01Q37:`${120/200*100}%`,F03Q35:`${(88/13).toFixed(1)}배`,F03Q36:`${(2389/7787*100).toFixed(1)}%`,F04Q37:`${50/500*100}%`,F05Q34:`${(1100-900)*5*60}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')+'건'};
  for(const [id,value] of Object.entries(expected))expect(questionMap[id].choices!.find(c=>c.id===questionMap[id].correctId)!.text).toBe(value);
  for(const [id,value] of Object.entries(expected)){
   const revisedId=id.replace(/^F(\d{2})Q/,'F26R$1Q');
   expect(questionMap[revisedId].choices!.find(c=>c.id===questionMap[revisedId].correctId)!.text).toBe(value);
  }
  const correctText=(id:string)=>{const q=questionMap[id];return q.choices!.find(c=>c.id===q.correctId)!.text;};
  expect(correctText('F26R02Q29')).toBe(`${(2410/(5377+2410)*100).toFixed(1)}%`);
  expect(correctText('F26R04Q31')).toBe(`${2+1+2}행 · ${new Set(['a','a','b','c','c']).size}작품`);
  expect(correctText('F26R05Q23')).toBe(String([null,'Kim','Lee'].filter(x=>x!==null).length));
  expect(correctText('F26R05Q31')).toBe(`2020년 등록 작품이 ${2153-2009}건 적음`);
 });
 it('asks about concepts with complete givens, never document recall',()=>{
  for(const q of finalQuestions){
   expect(q.id).toMatch(/^F26R0[1-5]Q\d{2}$/);
   expect(q.stem).not.toMatch(/PDF|교안|고정본|수업|쪽수|첫 행|첫 작품/);
   expect(q.steps.join(' ')).not.toMatch(/PDF|선지를 비교합니다|쪽/);
   expect(q.steps.length).toBeGreaterThan(0);
   if(q.exhibit)for(const row of q.exhibit.rows)expect(row.length).toBe(q.exhibit.columns.length);
  }
  for(const id of ['F26R01Q21','F26R02Q29','F26R03Q25','F26R03Q32','F26R04Q24','F26R04Q29','F26R04Q31','F26R05Q23','F26R05Q31'])expect(questionMap[id].exhibit).toBeTruthy();
  // Previously missing denominators and observation windows are now in the stem/table.
  for(const id of ['F26R01Q36','F26R03Q36'])expect(questionMap[id].stem).toMatch(/7,787.*2,389/);
  expect(questionMap.F26R01Q31.exhibit!.rows.flat().join(' ')).toContain('연초 일부');
  expect(questionMap.F26R03Q40.stem).toContain('연초 일부');
 });
 it('retains every archived question byte-for-byte semantically and excludes it from fresh practice',()=>{
  expect(createHash('sha256').update(JSON.stringify(archivedFinalQuestions)).digest('hex')).toBe('54f9355b1c55940554081573e2e1eb39572e80da14003cb105e3ae5fb050cb17');
  expect(archivedFinalQuestions).toHaveLength(200);
  for(const q of archivedFinalQuestions){
   expect(questionMap[q.id]).toBe(q);
   expect(allQuestions.some(x=>x.id===q.id)).toBe(false);
   expect(reviewQuestions.some(x=>x.id===q.id)).toBe(true);
  }
  expect(finalBlueprints.flatMap(r=>r.questionIds!)).not.toContain('F01Q21');
  expect(selectQuestions({pool:[questionMap.F01Q21],count:1,random:false}).ids).toEqual(['F01Q21']);
  const mixed=[questionMap.F01Q21,questionMap.F26R01Q21,questionMap.F05Q23];
  expect(new Set(selectQuestions({pool:mixed,count:3,random:false}).ids)).toEqual(new Set(mixed.map(q=>q.id)));
  expect(new Set(selectQuestions({pool:archivedFinalQuestions,count:200,random:false}).ids)).toEqual(new Set(archivedFinalQuestions.map(q=>q.id)));
 });
 it('restores and submits an old draft without reinterpreting its answers, bookmarks or wrong notes',async()=>{
  const owner='pre-concept-owner',target='pre-concept-restored',ids=['F01Q21','F05Q23'];
  const d=newDraft(owner,'practice','최종 범위 모의고사 1회 · 이전 기록',ids,60,true);
  const correct=questionMap[ids[0]].correctId!,wrong=questionMap[ids[1]].choices!.find(c=>c.id!==questionMap[ids[1]].correctId)!.id;
  await updateProfile(owner,p=>{
   p.draft=d;p.draft.answers[ids[0]]=correct;p.draft.answers[ids[1]]=wrong;
  });
  await toggleBookmark(owner,ids[0],'question');
  const backup=exportBackup(await getProfile(owner));expect(()=>validateBackup(backup)).not.toThrow();
  await importBackup(target,backup,'merge');
  const restored=await getProfile(target);
  expect(restored.draft!.questionIds).toEqual(ids);
  expect(restored.draft!.choiceOrders).toEqual(d.choiceOrders);
  expect(restored.bookmarks.some(b=>b.targetId==='F01Q21')).toBe(true);
  await submitDraft(target,restored.draft!.id);
  const submitted=await getProfile(target);
  expect(submitted.attempts[0].correct).toBe(1);expect(submitted.attempts[0].total).toBe(2);
  expect(submitted.wrongNotes[0].questionId).toBe('F05Q23');
  expect(()=>validateBackup(exportBackup(submitted))).not.toThrow();
 });
 it('extracts new chapter/bookmarked review questions without dropping any',()=>{
  for(const t of finalTopics){const pool=finalQuestions.filter(q=>q.topic===t.id);expect(new Set(selectQuestions({pool,count:pool.length,random:false}).ids)).toEqual(new Set(pool.map(q=>q.id)));}
 });
 it('preserves mixed legacy/final progress, saved choice order, backup and grading',async()=>{
  const owner='final-backup-user',round=finalBlueprints[2],ids=roundQuestions(round),d=newDraft(owner,'exam',round.title,ids,60,true);
  await readLesson(owner,'A2',true);await readLesson(owner,'FN3',true);
  await updateProfile(owner,p=>{p.draft=d;});
  await patchDraft(owner,d.id,x=>{x.answers[ids[0]]=questionMap[ids[0]].correctId!;x.index=4;});
  const saved=await getProfile(owner);expect(saved.draft!.choiceOrders).toEqual(d.choiceOrders);
  const backup=exportBackup(saved);expect(()=>validateBackup(backup)).not.toThrow();
  await importBackup('final-restore-user',backup,'merge');
  const restored=await getProfile('final-restore-user');expect(restored.progress.map(p=>p.lessonId)).toEqual(['A2','FN3']);
  expect(restored.draft!.choiceOrders).toEqual(d.choiceOrders);
  await submitDraft(owner,d.id);const submitted=await getProfile(owner);
  expect(submitted.attempts[0].total).toBe(40);expect(submitted.attempts[0].correct).toBe(1);expect(submitted.wrongNotes).toHaveLength(39);
  expect(questions).toHaveLength(195);
 });
});
