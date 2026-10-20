import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const {documents}=JSON.parse(await readFile(new URL('../src/content/notebook.json',import.meta.url),'utf8'));
const finalLessons=JSON.parse(await readFile(new URL('../src/content/final/lessons.json',import.meta.url),'utf8'));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
const report={base,viewports:[],errors:[],checks:[]};
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
await mkdir('test-results',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const overflow=async label=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1,`${width}px ${label} overflow`);};
  await page.goto(base+'#/notebook');await page.getByRole('heading',{name:'필기할 문장만, 또렷하게.',exact:true}).waitFor();
  assert.equal(await page.locator('.notebook-card').count(),4);await overflow('index');
  for(const doc of documents){
   await page.goto(base+'#/notebook/'+doc.id);await page.getByRole('heading',{name:doc.title+' · 필기노트',exact:true}).waitFor();
   assert.equal(await page.locator('.notebook-chapter').count(),doc.chapters.length);
   assert.equal(await page.locator('.chapter-summary').count(),doc.chapters.length);
   assert.equal(await page.locator('.notebook-section').count(),doc.sections.length);
   assert.equal(await page.locator('.note-table').count(),doc.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='table').length);
   assert.equal(await page.locator('.note-flow').count(),doc.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='flow').length);
   await overflow(doc.id);
   for(const link of await page.locator('.notebook-evidence').all())assert.match(await link.getAttribute('href'),new RegExp(`^#/handouts/${doc.id}\\?page=\\d+$`));
  }
  await page.goto(base+'#/notebook?view=summary');await page.getByRole('heading',{name:'모든 장 Summary',exact:true}).waitFor();
  assert.equal(await page.locator('.chapter-summary').count(),22);assert.equal(await page.locator('.note-entry,.note-table,.note-flow').count(),0);await overflow('all summaries');
  await page.getByRole('button',{name:'필기 복사',exact:true}).click();await page.getByText('현재 보이는 필기 내용을 복사했습니다.',{exact:true}).waitFor();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());assert(copied.includes('Summary'));assert(copied.includes('머신러닝'));assert(!copied.includes('게스트'));
  await page.goto(base+'#/notebook/bigdata');await page.getByText('Veracity · 신뢰성',{exact:true}).waitFor();
  await page.getByLabel('교수님 강조만',{exact:true}).check();await page.waitForURL(/highlight=1/);
  await page.getByText('Veracity · 신뢰성',{exact:true}).waitFor({state:'hidden'});
  assert.equal(await page.getByText('Veracity · 신뢰성',{exact:true}).count(),0);
  assert.equal(await page.getByText('Volume · 규모',{exact:true}).count(),1);
  await page.getByLabel('필기 내용 검색',{exact:true}).fill('Veracity');await page.getByRole('heading',{name:'조건에 맞는 필기가 없습니다.',exact:true}).waitFor();
  await page.getByRole('button',{name:'검색·강조 조건 초기화',exact:true}).click();await page.getByText('Veracity · 신뢰성',{exact:true}).waitFor();
  await page.getByLabel('필기 내용 검색',{exact:true}).fill('반정형');await page.waitForFunction(()=>document.querySelectorAll('.notebook-chapter').length===1);
  assert.equal(await page.locator('.notebook-chapter').count(),1);await overflow('filtered');
  if(width===1440){
   await page.goto(base+'#/notebook/bigdata?view=summary');await page.getByRole('heading',{name:'빅데이터란? · Summary',exact:true}).waitFor();
   const before=await page.locator('html').getAttribute('data-theme');await page.getByRole('button',{name:'테마 전환',exact:true}).click();
   await page.waitForFunction(value=>document.documentElement.dataset.theme!==value,before);await overflow('other theme');
   await page.getByRole('button',{name:'테마 전환',exact:true}).click();
   await page.emulateMedia({media:'print'});
   assert.equal(await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).display),'none');
   assert.equal(await page.locator('.notebook-toolbar').evaluate(el=>getComputedStyle(el).display),'none');
   assert.equal(await page.locator('.notebook-toc').evaluate(el=>getComputedStyle(el).display),'none');
   assert.equal(await page.locator('.chapter-summary').first().evaluate(el=>getComputedStyle(el).display),'block');
   await page.emulateMedia({media:'screen'});report.checks.push('both themes and clean print stylesheet');
  }
  for(const id of ['FN1','FN2','FN3']){
   await page.goto(base+'#/lessons/'+id);await page.getByRole('heading',{name:finalLessons.find(l=>l.id===id).title,exact:true}).waitFor();assert.equal(await page.locator('.chapter-summary').count(),1);
   assert(await page.locator('.chapter-summary dt').count()>=6);await overflow(id+' summary');
  }
  await page.goto(base+'#/notebook/netflix?view=summary');await page.getByRole('heading',{name:'Netflix 데이터 분석 · Summary',exact:true}).waitFor();
  if(width===390||width===1440)await page.screenshot({path:`test-results/notebook-summary-${width}.png`,fullPage:true,animations:'disabled'});
  await page.goto(base+'#/notebook/not-a-document');await page.getByRole('heading',{name:'이 필기노트를 찾을 수 없습니다.',exact:true}).waitFor();
  report.viewports.push({width,documents:4,chapterSummaries:22,allSourceSections:true,search:true,teacherFilter:true,copy:true,finalSummaries:3,noPageOverflow:true});
  console.log(`Verified notebook ${width}px: all four documents, 22 summaries, search, teacher filter, copy, final chapter summaries`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile('test-results/notebook-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
