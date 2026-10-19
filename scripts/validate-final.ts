import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {z} from 'zod';
import {finalLessons,finalQuestions,finalBlueprints,finalTopics,questionMap} from '../src/content';
import {roundQuestions} from '../src/engine';
import meta from '../src/content/final/meta.json';
const nonempty=z.string().min(1);
const ref=z.object({sourceId:z.literal('FINAL19'),pages:z.array(z.number().int().min(1).max(19)).nonempty()});
const qs=z.object({id:nonempty,topic:z.enum(['F1','F2','F3']),kind:z.literal('choice'),difficulty:z.enum(['중하','중','상']),stem:nonempty,choices:z.array(z.object({id:nonempty,text:nonempty,reason:nonempty})).length(4),correctId:nonempty,lessonId:nonempty,explanation:nonempty,sources:z.array(ref).nonempty()});
assert.equal(finalLessons.length,3);assert.equal(finalQuestions.length,200);assert.equal(finalBlueprints.length,5);
assert.equal(new Set(finalQuestions.map(q=>q.stem)).size,200);
const covered=new Set<number>(),seen=new Set<string>();
for(const l of finalLessons)for(const s of l.sections){assert(s.body.length>0);ref.parse(s.source);for(const p of s.source.pages)covered.add(p);}
assert.deepEqual([...covered].sort((a,b)=>a-b),Array.from({length:19},(_,i)=>i+1));
for(const q of finalQuestions){qs.parse(q);assert.equal(new Set(q.choices!.map(c=>c.text)).size,4);assert(q.choices!.some(c=>c.id===q.correctId));assert(finalLessons.some(l=>l.id===q.lessonId&&l.topic===q.topic));}
const rounds=finalBlueprints.map(r=>{
 const items=roundQuestions(r).map(id=>questionMap[id]);assert.equal(items.length,40);
 const difficulty=Object.fromEntries(['상','중','중하'].map(d=>[d,items.filter(q=>q.difficulty===d).length]));
 assert.deepEqual(difficulty,{'상':2,'중':6,'중하':32});
 const positions=[0,0,0,0];let uniqueLongest=0,correctCharacters=0,wrongCharacters=0;
 for(const q of items){assert(!seen.has(q.id));seen.add(q.id);const choices=q.choices!,correct=choices.find(c=>c.id===q.correctId)!;positions[choices.indexOf(correct)]++;correctCharacters+=correct.text.length;wrongCharacters+=choices.filter(c=>c!==correct).reduce((n,c)=>n+c.text.length,0);if(choices.filter(c=>c!==correct).every(c=>c.text.length<correct.text.length))uniqueLongest++;}
 assert.deepEqual(positions,[10,10,10,10]);assert(uniqueLongest<=10);
 const chapters=Object.fromEntries(finalTopics.map(t=>[t.id,items.filter(q=>q.topic===t.id).length]));
 return {id:r.id,items:items.length,difficulty,positions,chapters,uniqueLongestCorrect:uniqueLongest,meanCorrectCharacters:+(correctCharacters/40).toFixed(2),meanDistractorCharacters:+(wrongCharacters/120).toFixed(2)};
});
const report={edition:meta.edition,sourceSha256:meta.sourceSha256,sourcePages:19,chapters:3,sections:finalLessons.reduce((n,l)=>n+l.sections.length,0),uniqueQuestions:seen.size,rounds,pageLedger:finalLessons.flatMap(l=>l.sections.map(s=>({lesson:l.id,heading:s.heading,pages:s.source.pages}))),review:'19 pages read; diagrams/tables/code visually checked; source claims manually reviewed. Difficulty is an authoring target, not measured item difficulty. Length tests are a style guard, not proof that all test-taking cues are absent.',status:'PASS'};
writeFileSync('docs/final-scope-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,pageLedger:undefined},null,2));
