import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {finalBlueprints, finalQuestions, finalLessons, questionMap, lessonMap, finalTopics, questions} from '../src/content';
import {newDraft, roundQuestions, grade, selectQuestions} from '../src/engine';
import {readLesson,updateProfile,patchDraft,getProfile,exportBackup,validateBackup,importBackup,submitDraft} from '../src/storage';

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
