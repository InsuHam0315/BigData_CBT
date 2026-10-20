import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {courseQuestions,courseBlueprints,courseLessons,courseTopics,sourceMap,questionMap,lessonMap} from '../src/content';
import figures from '../src/content/source-figures.json';
import notebook from '../src/content/notebook.json';
import audit from '../docs/notebook-source-audit.json';
import {roundQuestions} from '../src/engine';

assert.equal(courseQuestions.length,200);assert.equal(courseBlueprints.length,5);assert.equal(courseTopics.length,4);assert.equal(courseLessons.length,4);
const highlightIds=new Set(audit.documents.flatMap(d=>d.highlightAnnotations.map(h=>h.id))),used=new Set<string>(),chapters=new Set<string>(),seen=new Set<string>(),usedFigures=new Set<string>();
assert.equal(highlightIds.size,44);
for(const f of figures){
 const bytes=readFileSync('public/figures/'+f.asset);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes.subarray(1,4).toString(),'PNG');
 assert.equal(bytes.readUInt32BE(16),f.width);assert.equal(bytes.readUInt32BE(20),f.height);
 const doc=notebook.documents.find(d=>d.id===f.documentId)!;assert(doc);assert.equal(doc.sourceSha256,f.sourceSha256);assert(f.page>=1&&f.page<=doc.pageCount);assert(doc.sections.some(s=>s.id===f.sectionId));assert(f.steps.length>=2);assert(f.takeaway.length>10);
}
const reports=courseBlueprints.map(round=>{
 const items=roundQuestions(round).map(id=>questionMap[id]);assert.equal(items.length,40);
 assert.deepEqual(Object.fromEntries(courseTopics.map(t=>[t.id,items.filter(q=>q.topic===t.id).length])),{P1:10,P2:6,P3:10,P4:14});
 assert.equal(items.filter(q=>q.highlightIds?.length).length,25);
 assert.deepEqual(Object.fromEntries(['중하','중','상'].map(d=>[d,items.filter(q=>q.difficulty===d).length])),{'중하':32,'중':6,'상':2});
 const positions=[0,0,0,0];let longest=0;
 for(const q of items){
  assert(!seen.has(q.id));seen.add(q.id);assert.equal(q.kind,'choice');assert.equal(q.choices?.length,4);assert.equal(new Set(q.choices!.map(c=>c.text)).size,4);assert(q.explanation.length>=15);
  const answer=q.choices!.find(c=>c.id===q.correctId)!;assert(answer);positions[q.choices!.indexOf(answer)]++;if(q.choices!.filter(c=>c!==answer).every(c=>c.text.length<answer.text.length))longest++;
  assert.equal(lessonMap[q.lessonId].topic,q.topic);assert(q.documentId);const doc=notebook.documents.find(d=>d.id===q.documentId)!;assert(doc.chapters.some(c=>c.id===q.notebookChapterId));chapters.add(q.notebookChapterId!);
  for(const h of q.highlightIds??[]){assert(highlightIds.has(h));used.add(h);const p=Number(h.split('-p')[1].split('-a')[0]);assert(q.sources.some(s=>s.pages.includes(p)));assert(h.startsWith(doc.id+'-p'));}
  for(const source of q.sources){assert.equal(sourceMap[source.sourceId].handoutId,doc.id);assert(source.pages.length);assert(source.pages.every(p=>Number.isInteger(p)&&p>=1&&p<=doc.pageCount));}
  for(const id of q.figureIds??[]){const f=figures.find(f=>f.id===id)!;assert(f);assert.equal(f.documentId,q.documentId);assert(q.sources.some(s=>s.pages.includes(f.page)));usedFigures.add(id);}
 }
 assert.deepEqual(positions,[10,10,10,10]);assert(longest<=14);
 // No four-question run is a single source unit: the displayed sequence is mixed.
 for(let i=0;i<=36;i++)assert(new Set(items.slice(i,i+4).map(q=>q.topic)).size>1);
 return {id:round.id,count:40,highlighted:25,regular:15,positions,figures:items.filter(q=>q.figureIds?.length).length,uniqueLongestCorrect:longest,documents:{environment:10,bigdata:6,infrastructure:10,netflix:14}};
});
assert.equal(new Set(courseQuestions.map(q=>q.stem)).size,200);assert.deepEqual([...used].sort(),[...highlightIds].sort());assert.equal(chapters.size,22);assert.equal(figures.length,25);assert.equal(figures.filter(f=>f.documentId==='netflix').length,17);
assert(figures.filter(f=>f.documentId==='netflix').every(f=>usedFigures.has(f.id)),'Every original Netflix chart is also used in a practice question');
const report={edition:'2026-10-21',status:'PASS',documents:4,academicSourcePages:158,chapterCoverage:22,uniqueQuestions:seen.size,actualHighlightsCovered:used.size,capturedFigures:figures.length,figuresUsedInQuestions:usedFigures.size,rounds:reports,review:'Original scenario questions; source chart labels and axes visually checked. Previous IDs and answer keys retained. Difficulty is an authoring target, not measured success rates.'};
writeFileSync('docs/course-exam-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
