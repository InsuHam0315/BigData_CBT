// Temporary browser contexts only; existing profiles and learner records stay untouched.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile,mkdir,writeFile } from 'node:fs/promises';
const lessons=JSON.parse(await readFile(new URL('../src/content/lessons.json',import.meta.url),'utf8'));
const topics=JSON.parse(await readFile(new URL('../src/content/topics.json',import.meta.url),'utf8'));
const questions=JSON.parse(await readFile(new URL('../src/content/questions.json',import.meta.url),'utf8'));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
const report={base,viewports:[],errors:[],legacyLinks:0};
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(`${m.text()} ${m.location().url}`);});
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const stable=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const overflow=async(path)=>{
   const extra=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   if(extra>1){
    console.log('OVERFLOW',await page.locator('main *').evaluateAll(nodes=>nodes.filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth&&!e.closest('.table-scroll,pre')).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,150),right:e.getBoundingClientRect().right}))));
    await page.screenshot({path:`test-results/overflow-${width}.png`,fullPage:false});
   }
   assert(extra<=1,`${width}px ${path} horizontal overflow ${extra}`);
   return extra;
  };
  await page.goto(base+'#/lessons');await page.locator('.chapter-card').first().waitFor();
  assert.equal(await page.locator('.chapter-card').count(),3);
  if(width<=760){
   await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.locator('.sidebar.open').waitFor();
   await page.keyboard.press('Shift+Tab');assert(await page.locator('.sidebar').evaluate(e=>e.contains(document.activeElement)));
   await page.keyboard.press('Tab');assert(await page.locator('.brand').evaluate(e=>e===document.activeElement));
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.sidebar').classList.contains('open'));
   assert.equal(await page.locator('.sidebar').isVisible(),false);
   await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.getByRole('button',{name:'메뉴 닫기',exact:true}).click({position:{x:width-8,y:450}});
   await page.waitForFunction(()=>!document.querySelector('.sidebar').classList.contains('open'));
   await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  }
  for(const toggle of await page.locator('.nav-toggle').all())if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  assert.equal(await page.locator('.nav-toggle[aria-expanded=true]').count(),13);
  const paths=await page.locator('.sidebar-nav a').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('href')))]);
  let maximum=0;
  for(const path of paths){
   await page.goto(base+path);await page.getByRole('main').waitFor();
   if(path.startsWith('#/notebook'))await page.locator('.notebook-page').waitFor();
   if(path.startsWith('#/figures'))await page.locator('.figure-gallery,.figure-reader').waitFor();
   await stable();
   const text=await page.getByRole('main').innerText();assert(text.length>30&&!/페이지를 찾을 수 없습니다|강의를 찾을 수 없습니다|자료를 찾을 수 없습니다/.test(text),path);
   maximum=Math.max(maximum,await overflow(path));
  }
  for(const topic of topics){
   await page.goto(base+'#/lessons/chapter/'+topic.id);await page.locator('.chapter-unit').first().waitFor();await stable();
   const members=lessons.filter(l=>l.topic===topic.id);
   assert.deepEqual(await page.locator('.chapter-unit').evaluateAll(nodes=>nodes.map(n=>n.id)),members.map(l=>l.id));
   assert.equal(await page.locator('.lesson-body-section').count(),members.reduce((n,l)=>n+l.sections.length,0));
   assert.equal(await page.locator('.lesson-body-section>.source-page').count(),members.reduce((n,l)=>n+l.sections.length,0));
   assert.equal(await page.locator('.source-correction').count(),members.reduce((n,l)=>n+l.corrections.length,0));
   assert.equal(await page.locator('.lesson-extra-section').count(),members.reduce((n,l)=>n+l.additionalSections.length,0));
   const duplicates=await page.locator('[id]').evaluateAll(nodes=>{const ids=nodes.map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[]);
   const first=members[0];
   const unit=page.locator(`[data-lesson-id=${first.id}]`);
   assert((await unit.locator('.lesson-body-section').first().innerText()).includes(first.sections[0].body[0]));
   const additional=page.locator(`#${first.id}-additional`);
   assert.equal(await additional.getAttribute('open'),null);
   await additional.locator(':scope > summary').click();
   assert(await additional.locator('.lesson-extra-section').first().isVisible());
   assert((await additional.innerText()).includes(first.additionalSections[0].body[0]));
   if(first.microLab)assert((await additional.locator(`#${first.id}-lab`).innerText()).includes('가상 입력'));
   await additional.locator(':scope > summary').click();
   await page.locator(`[data-lesson-id=${first.id}]`).getByRole('button',{name:'답 확인',exact:true}).click();
   assert((await page.locator(`#${first.id}-answer`).innerText()).includes(first.check.answer));
   await page.locator(`#${first.id}-self-checks details`).first().locator('summary').click();
   assert(await page.getByText(first.selfChecks[0].answer,{exact:true}).first().isVisible());
   await page.locator('.chapter-practice').first().locator('summary').click();await page.locator('.worked-example').first().waitFor();
   assert((await page.locator('.chapter-practice').first().innerText()).includes(first.walkthrough[0]));
   maximum=Math.max(maximum,await overflow('chapter '+topic.id+' expanded practice'));
   if(topic.id==='A'||topic.id==='H')await page.screenshot({path:`test-results/chapter-${topic.id}-${width}.png`,fullPage:false});
  }
  if(width>760){
   const original=(await page.locator('.main-wrap').boundingBox()).width;
   await page.getByRole('button',{name:'왼쪽 메뉴 접기',exact:true}).click();await page.locator('.app-shell.sidebar-closed').waitFor();
   assert.equal(await page.locator('#study-sidebar').isVisible(),false);assert((await page.locator('.main-wrap').boundingBox()).width>original);
   await page.reload();await page.getByRole('button',{name:'왼쪽 메뉴 펼치기',exact:true}).waitFor();
   await page.getByRole('button',{name:'왼쪽 메뉴 펼치기',exact:true}).click();await page.locator('.app-shell:not(.sidebar-closed)').waitFor();
   assert(await page.locator('#study-sidebar').isVisible());
   await page.getByRole('button',{name:'왼쪽 메뉴 접기',exact:true}).focus();await page.keyboard.press('Space');await page.locator('.app-shell.sidebar-closed').waitFor();
   await page.waitForFunction(()=>document.activeElement?.id==='sidebar-reopen');
   await page.keyboard.press('Space');await page.locator('.app-shell:not(.sidebar-closed)').waitFor();
  }
  const legacy=width===1440?lessons:[lessons[0],lessons.at(-1)];
  for(const l of legacy){await page.goto(base+'#/lessons/'+l.id);await page.locator(`[data-lesson-id=${l.id}]`).waitFor();await stable();assert.equal(await page.locator('.chapter-unit').count(),lessons.filter(x=>x.topic===l.topic).length);assert.equal(await page.locator('.nav-child[aria-current=page]').getAttribute('href'),`#/lessons/chapter/${l.topic}`);report.legacyLinks++;}
  await page.goto(base+'#/lessons/chapter/H?at=H3-code');await page.locator('#H3-code').waitFor();await stable();
  assert(await page.locator('#H3-additional').evaluate(e=>e.open));
  assert((await page.locator('#H3-code').boundingBox()).y>=0);
  for(const topic of ['A','H']){await page.goto(base+'#/practice?topic='+topic);await page.getByRole('heading',{name:`${questions.filter(q=>q.topic===topic).length}문항 복습`,exact:true}).waitFor();}
  // Old per-lesson backup records still target the same IDs inside a chapter.
  await page.goto(base+'#/account?view=backup');await page.locator('input[type=file]').waitFor();
  const now=new Date().toISOString(),owned={userId:'fixture',createdAt:now,updatedAt:now};
  const data={app:'bigdata-midterm-cbt',schemaVersion:1,exportedAt:now,profile:{...owned,schemaVersion:1,attempts:[],wrongNotes:[],progress:[{...owned,lessonId:'A2',completed:true}],bookmarks:[],draft:null,settings:{theme:'dark',shuffle:false},lastLessonId:'A2'}};
  await page.locator('input[type=file]').setInputFiles({name:'old-lesson.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).click();await page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});
  await page.goto(base+'#/lessons/A2');await page.locator('[data-lesson-id=A2]').getByRole('button',{name:'이 단원 읽기 완료 해제',exact:true}).waitFor();
  await page.getByRole('button',{name:'장 전체 읽기 완료',exact:true}).click();await page.getByRole('button',{name:'장 전체 읽기 완료 해제',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'이 단원 읽기 완료 해제',exact:true}).count(),5);
  report.viewports.push({width,menuRoutes:paths.length,chapters:8,maxOverflow:maximum,oldBackup:true,chapterProgress:true,desktopCollapse:width>760});
  console.log(`Verified ${width}px: ${paths.length} menu routes, 8 chapters, preserved backup/progress`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{await writeFile('test-results/chapter-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
