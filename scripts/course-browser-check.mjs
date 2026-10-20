// Isolated contexts and fictional records; never use a learner's saved profile.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const load=async name=>JSON.parse(await readFile(new URL('../src/content/'+name+'.json',import.meta.url),'utf8'));
const [figures,questions,rounds]=await Promise.all(['source-figures','course/questions','course/blueprints'].map(load));
const questionMap=Object.fromEntries(questions.map(q=>[q.id,q]));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
const report={base,captures:[],views:[],rounds:[],errors:[]};await mkdir('test-results',{recursive:true});
try{
 const assetContext=await browser.newContext();
 for(const f of figures){const response=await assetContext.request.get(base+'figures/'+f.asset);assert.equal(response.status(),200);assert.equal(createHash('sha256').update(await response.body()).digest('hex'),f.sha256);report.captures.push(f.id);}
 await assetContext.close();
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const overflow=async label=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const extra=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(extra<=1,`${width} ${label}: ${extra}px overflow`);};
  await page.goto(base+'#/');await page.getByRole('heading',{name:/PDF 4개 전체를/}).waitFor();assert.equal(await page.locator('.course-document-grid .chapter-card').count(),4);await overflow('home');
  await page.goto(base+'#/figures');await page.locator('.figure-gallery').waitFor();assert.equal(await page.locator('.figure-card').count(),25);await overflow('gallery');
  for(const f of figures){
   await page.goto(base+'#/figures/'+f.id);await page.locator('h1').filter({hasText:f.title}).waitFor();
   await page.locator(`.source-figure[data-figure-id="${f.id}"] .source-figure-image img`).waitFor();
   await page.waitForFunction(()=>{const img=document.querySelector('.source-figure-image img');return img?.complete&&img.naturalWidth>0;});
   assert.equal(await page.locator('.source-figure-reading li').count(),f.steps.length);
   assert.equal(await page.locator('.source-figure-tools a').getAttribute('href'),`#/handouts/${f.documentId}?page=${f.page}`);await overflow(f.id);
  }
  await page.goto(base+'#/figures/nf-country-genre');await page.locator('h1').filter({hasText:'주요 국가×주요 장르 히트맵'}).waitFor();
  await page.getByRole('button',{name:'주요 국가×주요 장르 히트맵 크게 보기',exact:true}).click();await page.locator('dialog[open]').waitFor();
  assert(await page.locator('dialog .source-dialog-image').evaluate(el=>el.scrollWidth>=el.clientWidth));await overflow('zoom dialog');
  await page.keyboard.press('Escape');await page.locator('dialog[open]').waitFor({state:'hidden'});
  await page.goto(base+'#/notebook/netflix');await page.getByRole('heading',{name:'Netflix 데이터 분석 · 필기노트',exact:true}).waitFor();assert.equal(await page.locator('.source-figure').count(),17);await overflow('notebook charts');
  await page.getByRole('button',{name:'이 PDF 읽기 완료',exact:true}).click();await page.getByRole('button',{name:'이 PDF 읽기 완료 해제',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'이 PDF 읽기 완료 해제',exact:true}).waitFor();
  if(width===390||width===1440)await page.screenshot({path:`test-results/course-notebook-${width}.png`,fullPage:false});
  report.views.push({width,captures:25,noOverflow:true,zoomKeyboard:true,notebookFigures:17,progressPersisted:true});
  // All five rounds at phone and desktop sizes; two intermediate widths above
  // exercise every figure, notebook integration and native zoom behavior.
  if(width===390||width===1440)for(let r=0;r<rounds.length;r++){
   const round=rounds[r],mode=r===4?'cbt':'mock';await page.goto(`${base}#/${mode}/${round.id}`);await page.getByRole('heading',{name:'응시 설정 · 40문항',exact:true}).waitFor();
   const mixed=r%2===0;await page.getByRole('checkbox').setChecked(mixed);await page.getByRole('button',{name:mode==='cbt'?'연습 시작':'시험 시작',exact:true}).click();await page.locator('.palette button').last().waitFor();assert.equal(await page.locator('.palette button').count(),40);
   const ids=width===1440?round.questionIds:round.questionIds.slice(0,6),positions=[0,0,0,0];
   for(let i=0;i<ids.length;i++){
    const q=questionMap[ids[i]];await page.getByRole('heading',{name:q.stem,exact:true}).waitFor();
    const order=await page.locator('.choices input').evaluateAll(nodes=>nodes.map(n=>n.value));positions[order.indexOf(q.correctId)]++;
    assert.equal(await page.locator('.question-panel > .question-source-figure').count(),q.figureIds.length);
    assert.equal(await page.locator('.question-panel .source-figure-reading').count(),0);
    if(mode==='mock')assert.equal(await page.locator('.question-panel .explanation').count(),0);
    if(i===0)await overflow('exam');
    await page.locator(`.choices input[value="${q.correctId}"]`).click();await page.waitForFunction(id=>document.querySelector('.choice.selected input')?.value===id,q.correctId);
    if(i===2){await page.reload();await page.getByRole('heading',{name:q.stem,exact:true}).waitFor();assert.deepEqual(await page.locator('.choices input').evaluateAll(nodes=>nodes.map(n=>n.value)),order);assert(await page.locator(`input[value="${q.correctId}"]`).isChecked());}
    if(mode==='cbt'&&i===0){await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.question-panel .explanation').waitFor();assert((await page.locator('.question-panel .explanation').innerText()).includes('필기본.pdf'));assert((await page.locator('.question-panel .explanation > a').getAttribute('href')).startsWith('#/notebook/'));}
    if(i<ids.length-1)await page.getByRole('button',{name:'다음',exact:true}).click();
   }
   if(width===1440)assert.deepEqual(positions,[10,10,10,10]);await page.getByRole('button',{name:/전체 제출 · 미응답/}).click();await page.locator('.result-summary').waitFor();assert((await page.locator('.result-summary').innerText()).includes(`${ids.length} / 40`));assert.equal(await page.locator('.result-question').count(),40);
   await page.reload();await page.locator('.result-summary').waitFor();await page.goto(base+'#/records?view=attempts');await page.getByRole('heading',{name:'응시 이력',exact:true}).waitFor();assert((await page.getByRole('main').innerText()).includes(round.title));
   report.rounds.push({width,id:round.id,mode,mixed,answered:ids.length,total:40,positions,reloadAndGrade:true,noPrematureHints:true});console.log(`Verified full course ${width}px ${round.id}: ${ids.length} answers, original charts, persisted grading`);
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile('test-results/course-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
