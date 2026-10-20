// Isolated test profiles only. Exercise the actual displayed choices and saved results.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const load=async name=>JSON.parse(await readFile(new URL(`../src/content/final/${name}.json`,import.meta.url),'utf8'));
const [questions,rounds,lessons]=await Promise.all(['questions','blueprints','lessons'].map(load));
const archive=await load('archive-questions');
const map=Object.fromEntries(questions.map(q=>[q.id,q]));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
await mkdir('test-results',{recursive:true});
const report={base,notes:[],rounds:[],errors:[],overflow:[]};
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const overflow=async label=>{const n=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(n<=1,`${width} ${label}: ${n}px overflow`);report.overflow.push({width,label,extra:n});};
  await page.goto(base);await page.getByRole('heading',{name:/PDF 4개 전체를/}).waitFor();
  assert.equal(await page.locator('.course-document-grid .chapter-card').count(),4);await overflow('home');
  await page.screenshot({path:`test-results/final-home-${width}.png`,fullPage:width===1440});
  for(const mode of ['cbt','mock']){
   await page.goto(`${base}#/${mode}?scope=concept`);
   await page.getByRole('heading',{name:/개념 종합 (문제 연습|모의고사) 1~5회/,exact:true}).waitFor();
   assert.equal(await page.locator('.final-round-grid article').count(),5);
   await overflow('concept round list '+mode);
  }
  for(const l of lessons){
   await page.goto(base+'#/lessons/'+l.id);await page.locator('.final-note-section').last().waitFor();
   assert.equal(await page.locator('.final-note-section').count(),l.sections.length);
   assert.equal(await page.locator('.final-note-section>.source-page').count(),l.sections.length);
   assert.equal(await page.locator('main img').count(),0);
   for(const s of l.sections)assert((await page.locator('.final-note').innerText()).includes(s.body[0]));
   for(const details of await page.locator('.final-code').all())await details.locator('summary').click();
   await overflow(l.id+' expanded');
   await page.getByRole('button',{name:'이 장 읽기 완료',exact:true}).click();await page.getByRole('button',{name:'이 장 읽기 완료 해제',exact:true}).waitFor();
   await page.reload();await page.getByRole('button',{name:'이 장 읽기 완료 해제',exact:true}).waitFor();
   if(l.id==='FN3'){await page.locator('.final-note-section').nth(4).scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/final-notes-${width}.png`,fullPage:false});}
   report.notes.push({width,id:l.id,sections:l.sections.length,persisted:true});
  }
  for(let r=0;r<rounds.length;r++){
   const round=rounds[r],mode=r===4?'cbt':'mock';
   await page.goto(`${base}#/${mode}/${round.id}`);await page.getByRole('heading',{name:'응시 설정 · 40문항',exact:true}).waitFor();
   const mixed=r%2===0;await page.getByRole('checkbox').setChecked(mixed);
   await page.getByRole('button',{name:mode==='cbt'?'연습 시작':'시험 시작',exact:true}).click();
   await page.locator('.palette button').last().waitFor({state:'attached'});assert.equal(await page.locator('.palette button').count(),40);
   const positions=[0,0,0,0],orderBefore=[];
   const ids=width===1440?round.questionIds:round.questionIds.slice(0,8);
   for(let i=0;i<ids.length;i++){
    const q=map[ids[i]];
    await page.getByRole('heading',{name:q.stem,exact:true}).waitFor();
    const order=await page.locator('.choices input').evaluateAll(nodes=>nodes.map(n=>n.value));
    assert.deepEqual(new Set(order),new Set(q.choices.map(c=>c.id)));
    positions[order.indexOf(q.correctId)]++;orderBefore.push(order);
    assert.equal(await page.locator('.quiz-material').isVisible(),false);
    assert.equal(await page.locator('.question-panel .question-exhibit').count(),q.exhibit?1:0);
    if(q.exhibit){
     if(q.exhibit.code)assert.equal(await page.locator('.question-panel .question-exhibit pre').innerText(),q.exhibit.code);
     assert.equal(await page.locator('.question-panel .question-exhibit tbody tr').count(),q.exhibit.rows.length);
     for(const row of q.exhibit.rows)for(const cell of row)assert((await page.locator('.question-panel .question-exhibit').innerText()).includes(cell));
     await overflow(q.id+' givens');
    }
    if(mode==='mock')assert.equal(await page.locator('.question-panel .explanation').count(),0);
    await page.locator(`input[value="${q.correctId}"]`).click();
    await page.waitForFunction(value=>document.querySelector('.choice.selected input')?.value===value,q.correctId);
    if(i===0){await overflow('quiz');if(r===0)await page.screenshot({path:`test-results/final-quiz-${width}.png`,fullPage:false});}
    if(i===3){await page.reload();await page.getByRole('heading',{name:q.stem,exact:true}).waitFor();assert.deepEqual(await page.locator('.choices input').evaluateAll(nodes=>nodes.map(n=>n.value)),order);assert(await page.locator(`input[value="${q.correctId}"]`).isChecked());}
    if(mode==='cbt'&&i===0){await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.question-panel .explanation').waitFor();assert((await page.locator('.question-panel .explanation').innerText()).includes('빅데이터1-3장.pdf'));}
    if(i<ids.length-1)await page.getByRole('button',{name:'다음',exact:true}).click();
   }
   if(width===1440)assert.deepEqual(positions,[10,10,10,10]);
   if(await page.locator('.palette-toggle').isVisible())await page.getByRole('button',{name:'문제 번호',exact:true}).click();
   await page.getByRole('button',{name:/전체 제출 · 미응답/}).click();
   await page.locator('.result-summary').waitFor();
   assert((await page.locator('.result-summary').innerText()).includes(`${ids.length} / 40`));
   assert.equal(await page.locator('.result-question').count(),40);
   assert.equal(await page.locator('.result-question .question-exhibit').count(),round.questionIds.filter(id=>map[id].exhibit).length);
   await page.reload();await page.locator('.result-summary').waitFor();
   await page.goto(base+'#/records?view=attempts');await page.getByRole('heading',{name:'응시 이력',exact:true}).waitFor();assert((await page.getByRole('main').innerText()).includes(round.title));
   report.rounds.push({width,round:round.id,mode,mixed,answered:ids.length,total:40,positions,reloadAndGrading:true});
   console.log(`Verified ${width}px ${round.id}: ${ids.length} answers, grade + reload + records`);
  }
  // A saved bookmark/deep link to the superseded wording must still be reviewable.
  const old=archive.find(q=>q.id==='F01Q21');
  await page.goto(`${base}#/practice?question=${old.id}`);
  await page.getByRole('heading',{name:'1문항 복습',exact:true}).waitFor();
  await page.getByRole('button',{name:'복습 시작',exact:true}).click();
  await page.getByRole('heading',{name:old.stem,exact:true}).waitFor();
  await page.getByRole('link',{name:'개념 적용판 새 회차 선택 →',exact:true}).waitFor();
  await page.locator(`input[value="${old.correctId}"]`).click();
  await page.waitForFunction(id=>document.querySelector('.choice.selected input')?.value===id,old.correctId);
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();
  await page.locator('.choice-correct').waitFor();
  await page.getByRole('link',{name:'개념 적용판 새 회차 선택 →',exact:true}).click();
  await page.getByRole('heading',{name:'개념 종합 문제 연습 1~5회',exact:true}).waitFor();
  console.log(`Verified ${width}px archived question: original wording + answer retained`);
  await ctx.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile('test-results/final-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
