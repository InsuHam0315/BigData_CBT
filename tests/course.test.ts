import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {courseQuestions,courseBlueprints,questionMap,finalQuestions} from '../src/content';
import {newDraft,roundQuestions,grade} from '../src/engine';
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
  const expected=[sampleMAE.toFixed(2)+'년',(6.22-4.83).toFixed(2)+'년','7년','4.83년',((6.22-4.83)/6.22*100).toFixed(1)+'%'];
  for(let i=0;i<5;i++){const q=courseQuestions.find(q=>q.id.startsWith(`C26R0${i+1}`)&&q.concept==='mae')!;expect(q.choices!.find(c=>c.id===q.correctId)!.text).toBe(expected[i]);}
 });
 it('backs up new progress, answered results, wrong notes and bookmarks alongside old history',async()=>{
  const owner='course-backup-fixture',ids=roundQuestions(courseBlueprints[0]);await readLesson(owner,'A2',true);await readLesson(owner,'FN3',true);await readLesson(owner,'PN4',true);
  const draft=newDraft(owner,'exam','full course fixture',ids,60,true);draft.answers[ids[0]]=questionMap[ids[0]].correctId!;draft.answers[ids[1]]=questionMap[ids[1]].choices!.find(c=>c.id!==questionMap[ids[1]].correctId)!.id;
  await updateProfile(owner,p=>{p.draft=draft;});await submitDraft(owner,draft.id);await toggleBookmark(owner,ids[1],'question');
  const before=await getProfile(owner);const backup=exportBackup(before);await importBackup('course-import-fixture',backup,'replace');const restored=await getProfile('course-import-fixture');
  expect(restored.progress.map(p=>p.lessonId)).toEqual(['A2','FN3','PN4']);expect(restored.attempts.at(-1)?.correct).toBe(1);expect(restored.attempts.at(-1)?.total).toBe(40);expect(restored.wrongNotes.some(w=>w.questionId===ids[1])).toBe(true);expect(restored.bookmarks.some(b=>b.targetId===ids[1])).toBe(true);expect(restored.attempts.every(a=>a.userId==='course-import-fixture')).toBe(true);
 });
});
