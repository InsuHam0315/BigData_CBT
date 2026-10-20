// Dedicated temporary profiles only; exercises both current and saved older editions.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const load=async p=>JSON.parse(await readFile(new URL('../src/content/'+p+'.json',import.meta.url),'utf8'));
const all=[...await load('course/questions'),...await load('final/questions')];
const map=Object.fromEntries(all.map(q=>[q.id,q]));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
const browser=await chromium.launch({headless:true});
const report={views:[],errors:[]};await mkdir('test-results',{recursive:true});
try {
 for(const width of [320,390,768,1199,1440])for(const roundNumber of [1,2]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1,`${width} overflow`);
  const choose=async value=>{
   await page.locator(`.choices input[value="${value}"]`).click();
   // Answers render after the IndexedDB transaction resolves.
   await page.waitForFunction(id=>document.querySelector('.choice.selected input')?.value===id&&document.querySelector('.choice.selected input').checked,value);
  };
  const openNumbers=async()=>{if(width<1200&&await page.locator('.palette-toggle').getAttribute('aria-expanded')==='false')await page.getByRole('button',{name:'문제 번호',exact:true}).click();};
  const expectNavigationVisible=async()=>{
   const [n,h]=await Promise.all([page.locator('.quiz-navigation').boundingBox(),page.locator('.topbar').boundingBox()]);
   assert(n.y>=h.y+h.height,`${width}: navigation hidden under app header`);
   assert(n.y+n.height<=1000,`${width}: navigation below viewport`);
  };
  await page.goto(base+'#/cbt/final-'+roundNumber);await page.getByRole('button',{name:'연습 시작',exact:true}).click();
  await page.locator('.question-panel h2').waitFor();
  const id=await page.locator('.question-panel .tags .tag').first().innerText(),q=map[id];
  assert.match(id,/^F26R/);
  const wrong=q.choices.find(c=>c.id!==q.correctId).id;
  await choose(wrong);
  assert.equal(await page.locator('.choice-incorrect,.choice-correct').count(),0,'No correctness before checking');
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();
  await page.locator('.palette button[aria-label="1번 오답"]').waitFor({state:'attached'});
  assert.equal(await page.locator('.choice-incorrect').count(),1);assert.equal(await page.locator('.choice-correct').count(),1);
  assert.match(await page.locator('.choice-incorrect').innerText(),/내 오답/);
  assert.match(await page.locator('.explanation-answer').innerText(),/내 답 \(오답\)/);
  for(const theme of ['dark','light']){
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'테마 전환',exact:true}).click();
   await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme);
   const colors=await page.evaluate(()=>['.choice-incorrect','.choice-incorrect .choice-number','.palette .is-incorrect','.explanation-answer','.grade-status.incorrect'].map(s=>getComputedStyle(document.querySelector(s)).color));
   assert(colors.every(c=>c===colors[0]),`${width} ${theme}: wrong answer colors disagree`);
   assert.notEqual(colors[0],await page.locator('.choice-correct .choice-number').evaluate(e=>getComputedStyle(e).color));
  }
  await page.reload();await page.locator('.choice-incorrect').waitFor();await overflow();
  await page.locator('.explanation .sources').scrollIntoViewIfNeeded();await expectNavigationVisible();
  if(width>=1200){
   const [p,c]=await Promise.all([page.locator('.palette-panel').boundingBox(),page.locator('.question-panel').boundingBox()]);
   assert(p.x>=c.x+c.width,'Question numbers must sit to the right');
  }else{
   assert.equal(await page.locator('.palette-panel').isVisible(),false);
   await openNumbers();await page.getByRole('button',{name:'1번 오답',exact:true}).waitFor();await overflow();
   await page.keyboard.press('Escape');assert.equal(await page.locator('.palette-panel').isVisible(),false);
   assert(await page.locator('.palette-toggle').evaluate(e=>e===document.activeElement));
  }
  await page.getByRole('button',{name:'다음',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.quiz-navigation strong').textContent==='2 / 40');
  await openNumbers();await page.getByRole('button',{name:'1번 오답',exact:true}).click();await page.locator('.choice-incorrect').waitFor();await expectNavigationVisible();
  if(width<1200)assert.equal(await page.locator('.palette-panel').isVisible(),false);
  await choose(q.correctId);
  await page.waitForFunction(()=>!document.querySelector('.choice-incorrect,.choice-correct,.palette .is-incorrect'));
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.palette .is-correct').waitFor({state:'attached'});
  assert.equal(await page.locator('.choice-incorrect').count(),0);assert.match(await page.locator('.explanation-answer').innerText(),/내 답 \(정답\)/);
  // Put the wrong answer back, then verify the submitted result keeps that feedback.
  await choose(wrong);await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.choice-incorrect').waitFor();
  await openNumbers();await page.getByRole('button',{name:/전체 제출 · 미응답/}).click();await page.locator('.result-summary').waitFor();
  assert(await page.locator('.result-question').first().getAttribute('class').then(c=>c.includes('result-incorrect')));
  assert.match(await page.locator('.result-question .explanation-answer').first().innerText(),/오답/);
  // New exam: choosing a wrong option must not reveal answers or palette grades.
  await page.goto(base+'#/mock/course-'+roundNumber);await page.getByRole('button',{name:'시험 시작',exact:true}).click();await page.locator('.question-panel h2').waitFor();
  const examId=await page.locator('.question-panel .tags .tag').first().innerText(),eq=map[examId];
  assert.match(examId,/^C26V2R/);
  await choose(eq.choices.find(c=>c.id!==eq.correctId).id);
  assert.equal(await page.locator('.choice-incorrect,.choice-correct,.palette .is-incorrect,.palette .is-correct,.question-panel .explanation').count(),0);
  await overflow();await ctx.close();
  report.views.push({width,roundNumber,redFeedback:true,themes:2,stickyNavigation:true,paletteJump:true,reload:true,noExamLeak:true});
  console.log(`Verified quiz feedback/navigation ${width}px final-${roundNumber} / course-${roundNumber}: red wrong choice, palette, edit/reset, reload, exam secrecy`);
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile('test-results/quiz-navigation-report.json',JSON.stringify(report,null,2));await browser.close();}
