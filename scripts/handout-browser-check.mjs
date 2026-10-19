import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const documents=JSON.parse(await readFile(new URL('../src/content/handouts.json',import.meta.url),'utf8'));
const base=process.env.CBT_BASE??'http://127.0.0.1:4173/BigData_CBT/';
const report={base,pdfs:[],viewports:[],errors:[]};
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
await mkdir('test-results',{recursive:true});
try{
 const request=await browser.newContext();
 for(const d of documents){
  const response=await request.request.get(base+'materials/'+d.asset);
  assert.equal(response.status(),200);
  assert.match(response.headers()['content-type'],/^application\/pdf/);
  const bytes=await response.body();assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  assert.equal(bytes.length,d.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),d.sha256);
  assert(d.annotatedPages.every(p=>Number.isInteger(p)&&p>=1&&p<=d.pages));
  assert(d.contents.every(c=>c.page>=1&&c.page<=d.pages));
  report.pdfs.push({id:d.id,pages:d.pages,bytes:d.bytes,sha256:d.sha256,originalPreserved:true});
 }
 await request.close();
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  const overflow=async label=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const n=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(n<=1,`${width} ${label}: overflow ${n}`);};
  await page.goto(base+'#/handouts');await page.getByRole('heading',{name:'수업 필기자료실',exact:true}).waitFor();assert.equal(await page.locator('.handout-card').count(),4);await overflow('index');
  if(width===390||width===1440)await page.screenshot({path:`test-results/handouts-${width}.png`,fullPage:true,animations:'disabled'});
  for(const d of documents){
   await page.goto(base+'#/handouts/'+d.id);await page.getByRole('heading',{name:d.title,exact:true}).waitFor();
   assert.equal(await page.locator('.handout-page-links button').count(),d.annotatedPages.length);
   assert.equal(await page.locator('iframe').count(),0);await overflow(d.id);
   const dl=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'원본 다운로드',exact:true}).click()]);
   assert.equal(dl[0].suggestedFilename(),d.filename);
   const chunks=[];for await(const chunk of await dl[0].createReadStream())chunks.push(chunk);
   assert.equal(createHash('sha256').update(Buffer.concat(chunks)).digest('hex'),d.sha256);
   const target=d.annotatedPages[0];
   await page.getByRole('button',{name:`p${target}`,exact:true}).first().click();
   await page.waitForFunction(expected=>document.querySelector('iframe')?.getAttribute('src')?.includes(expected),`${d.asset}#page=${target}&view=FitH`);
   assert.equal(await page.getByLabel('PDF 쪽',{exact:true}).inputValue(),String(target));await overflow(d.id+' preview');
   await page.getByLabel('PDF 쪽',{exact:true}).selectOption(String(d.pages));await page.waitForFunction(expected=>document.querySelector('iframe')?.getAttribute('src')?.includes(expected),`#page=${d.pages}&`);
   assert(await page.getByRole('button',{name:'다음 PDF 쪽',exact:true}).isDisabled());
   await page.getByRole('button',{name:'미리보기 접기',exact:true}).click();assert.equal(await page.locator('iframe').count(),0);
  }
  await page.goto(base+'#/lessons/FN3');await page.locator('.related-handouts').waitFor();assert.equal(await page.locator('.related-handouts a').getAttribute('href'),'#/handouts/netflix');
  await page.goto(base+'#/handouts/infrastructure?page=9999');await page.getByRole('heading',{name:'빅데이터 인프라',exact:true}).waitFor();assert.equal(await page.getByLabel('PDF 쪽',{exact:true}).inputValue(),'25');
  report.viewports.push({width,documents:4,downloads:true,pageNavigation:true,relatedNote:true});
  console.log(`Verified ${width}px: four handouts, exact PDF downloads, annotations and page navigation`);
  await context.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{await writeFile('test-results/handout-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
