import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {notebookDocuments,notebookEdition,blockText} from '../src/notebook';
import handouts from '../src/content/handouts.json';
import summaries from '../src/content/final/chapter-summaries.json';
import {finalLessons} from '../src/content';

const ids=new Set<string>(),counts={note:0,table:0,flow:0,summaryPoints:0};
const text=(value:string)=>assert(typeof value==='string'&&value.trim().length>0);
for(const d of notebookDocuments){
 const original=handouts.find(h=>h.id===d.id)!;
 assert(original);assert.equal(d.sourceSha256,original.sha256);assert.equal(d.pageCount,original.pages);
 const pages=(list:number[])=>{assert(list.length);assert.equal(new Set(list).size,list.length);for(const p of list)assert(Number.isInteger(p)&&p>=1&&p<=d.pageCount);};
 const marks=(list:string[],p:number[])=>{for(const h of list){const match=h.match(new RegExp(`^${d.id}-p(\\d+)-a(\\d+)$`));assert(match);assert(p.includes(Number(match[1])));assert(original.annotatedPages.includes(Number(match[1])));}};
 const id=(value:string)=>{assert(!ids.has(value));ids.add(value);};
 for(const s of d.sections){id(s.id);text(s.title);pages(s.pages);assert(s.blocks.length);
  for(const b of s.blocks){id(b.id);pages(b.pages);marks(b.highlightIds,b.pages);counts[b.kind]++;text(blockText(b));
   if(b.kind==='note'){text(b.term);text(b.meaning);b.points.forEach(text);if(b.correction){text(b.correction.text);if(b.correction.url)assert.equal(new URL(b.correction.url).protocol,'https:');}}
   if(b.kind==='flow'){text(b.title);assert(b.steps.length>=2);b.steps.forEach(text);}
   if(b.kind==='table'){text(b.title);assert(b.columns.length>=2);assert(b.rows.length);for(const r of b.rows){assert.equal(r.cells.length,b.columns.length);r.cells.forEach(text);pages(r.pages);marks(r.highlightIds,r.pages);}}
  }
 }
 const assigned=d.chapters.flatMap(c=>c.sectionIds);
 assert.equal(assigned.length,new Set(assigned).size,'Each section belongs to exactly one chapter');
 assert.deepEqual([...assigned].sort(),d.sections.map(s=>s.id).sort());
 for(const c of d.chapters){id(c.id);text(c.title);assert(c.points.length>=4);counts.summaryPoints+=c.points.length;for(const p of c.points){text(p.term);text(p.meaning);pages(p.pages);marks(p.highlightIds,p.pages);}}
}
assert.deepEqual(Object.keys(summaries).sort(),finalLessons.map(l=>l.id).sort());
for(const items of Object.values(summaries))for(const [term,meaning] of items){text(term);text(meaning);}
const report={edition:notebookEdition,status:'PASS',documents:notebookDocuments.length,chapters:notebookDocuments.reduce((n,d)=>n+d.chapters.length,0),sections:notebookDocuments.reduce((n,d)=>n+d.sections.length,0),...counts,finalChapterSummaries:Object.keys(summaries).length,highlightAnnotations:notebookDocuments.reduce((n,d)=>n+d.highlightCount,0)};
writeFileSync('docs/notebook-content-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('Notebook content audit:',JSON.stringify(report));
