import {useEffect,useMemo,useState} from 'react';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {ArrowLeft,ArrowRight,BookOpen,Copy,FileText,List,Printer,Search} from 'lucide-react';
import {notebookDocuments,filterBlock,blockText,summaryText,type NoteBlock,type NoteChapter,type NoteDocument} from '../notebook';
import {ChapterSummary,TeacherBadge} from '../components/ChapterSummary';
import {Heading} from '../components/UI';
import {formatPages} from '../components/Materials';
import './Notebook.css';

function Evidence({document,pages}:{document:NoteDocument;pages:number[]}){
 return <Link className="notebook-evidence" to={`/handouts/${document.id}?page=${pages[0]}`}><FileText size={13}/>원본 p{formatPages(pages)} ↗</Link>;
}

function Block({block,document}:{block:NoteBlock;document:NoteDocument}){
 const teacher=!!block.highlightIds.length;
 if(block.kind==='note')return <div className={`note-entry${teacher?' teacher-entry':''}`} id={block.id}>
  <p className="note-definition"><strong className={teacher?'teacher-term':''}>{block.term}</strong><span aria-hidden="true">: </span>{block.meaning}{teacher&&<TeacherBadge/>}</p>
  {!!block.points.length&&<ul>{block.points.map(point=><li key={point}>{point}</li>)}</ul>}
  {block.correction&&<p className="note-correction"><strong>바로잡기: </strong>{block.correction.text}{block.correction.url&&<> <a href={block.correction.url} target="_blank" rel="noopener noreferrer">확인 근거 ↗</a></>}</p>}
  <Evidence document={document} pages={block.pages}/>
 </div>;
 if(block.kind==='flow')return <figure className={`note-flow${teacher?' teacher-entry':''}`} id={block.id}>
  <figcaption><strong className={teacher?'teacher-term':''}>{block.title}</strong>{teacher&&<TeacherBadge/>}</figcaption>
  <ol>{block.steps.map((step,i)=><li key={step+i}><span className="flow-index">{String(i+1).padStart(2,'0')}</span><span>{step}</span>{i<block.steps.length-1&&<ArrowRight size={17} className="flow-arrow" aria-hidden="true"/>}</li>)}</ol>
  {block.note&&<p className="note-table-tip">{block.note}</p>}<Evidence document={document} pages={block.pages}/>
 </figure>;
 return <figure className={`note-table${teacher?' teacher-entry':''}`} id={block.id}>
  <figcaption><strong className={teacher?'teacher-term':''}>{block.title}</strong>{teacher&&<TeacherBadge/>}</figcaption>
  <div className="note-table-scroll" role="region" aria-label={block.title+' 표'} tabIndex={0}><table><thead><tr>{block.columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{block.rows.map((row,i)=><tr key={i} className={row.highlightIds.length?'teacher-row':''}>{row.cells.map((cell,j)=>j===0?<th key={j} scope="row"><span className={row.highlightIds.length?'teacher-term':''}>{cell}</span>{!!row.highlightIds.length&&<TeacherBadge/>}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
  {block.note&&<p className="note-table-tip">{block.note}</p>}<Evidence document={document} pages={block.pages}/>
 </figure>;
}

function ChapterView({chapter,document,summaryOnly,query,teacherOnly}:{chapter:NoteChapter;document:NoteDocument;summaryOnly:boolean;query:string;teacherOnly:boolean}){
 const q=query.trim().toLocaleLowerCase('ko');
 const chapterMatches=!!q&&chapter.title.toLocaleLowerCase('ko').includes(q);
 const sections=document.sections.filter(s=>chapter.sectionIds.includes(s.id)).map(s=>({...s,blocks:s.blocks.map(b=>filterBlock(b,chapterMatches?'':query,teacherOnly)).filter((b):b is NoteBlock=>b!==null)})).filter(s=>s.blocks.length);
 const points=chapter.points.filter(p=>(!teacherOnly||p.highlightIds.length)&&(!q||chapterMatches||(p.term+' '+p.meaning).toLocaleLowerCase('ko').includes(q)));
 if((summaryOnly&&!points.length)||(!summaryOnly&&!sections.length&&!points.length))return null;
 return <article className="notebook-chapter" id={chapter.id}>
  <header className="notebook-chapter-title"><span className="eyebrow">{document.title}</span><h2>{chapter.title}</h2></header>
  {!summaryOnly&&sections.map(section=><section className="notebook-section" key={section.id} id={section.id}><h3>{section.title}</h3><div className="notebook-blocks">{section.blocks.map(block=><Block key={block.id} document={document} block={block}/>)}</div></section>)}
  {!!points.length&&<ChapterSummary id={`${chapter.id}-summary`} title={summaryOnly?'Summary · '+chapter.title:'Summary · 이 장의 핵심 필기'} items={points}/>}
 </article>;
}

export default function Notebook(){
 const {documentId}=useParams();
 const document=notebookDocuments.find(d=>d.id===documentId);
 const [params,setParams]=useSearchParams();
 const summaryOnly=params.get('view')==='summary',query=params.get('q')??'',teacherOnly=params.get('highlight')==='1';
 const [message,setMessage]=useState('');
 const [tocOpen,setTocOpen]=useState(()=>window.matchMedia('(min-width: 1150px)').matches);
 useEffect(()=>{setMessage('');},[documentId,summaryOnly,query,teacherOnly]);
 const change=(name:string,value:string)=>{const next=new URLSearchParams(params);if(value)next.set(name,value);else next.delete(name);setParams(next,{replace:true});};
 const root=document?`/notebook/${document.id}`:'/notebook';
 const visibleDocs=document?[document]:notebookDocuments;
 const content=useMemo(()=>visibleDocs.flatMap(d=>d.chapters.map(chapter=>{
   const q=query.trim().toLocaleLowerCase('ko'),chapterMatches=!!q&&chapter.title.toLocaleLowerCase('ko').includes(q);
   const points=chapter.points.filter(p=>(!teacherOnly||p.highlightIds.length)&&(!q||chapterMatches||(p.term+' '+p.meaning).toLocaleLowerCase('ko').includes(q)));
   const sections=d.sections.filter(s=>chapter.sectionIds.includes(s.id)).map(s=>({...s,blocks:s.blocks.map(b=>filterBlock(b,chapterMatches?'':query,teacherOnly)).filter((b):b is NoteBlock=>b!==null)})).filter(s=>s.blocks.length);
   return {document:d,chapter,points,sections};
 })).filter(c=>summaryOnly?c.points.length:c.points.length||c.sections.length),[documentId,summaryOnly,query,teacherOnly]);
 const copy=async()=>{
   const text=['빅데이터 필기용 핵심노트',document?document.filename:'PDF 4개 · 전체 장 Summary',teacherOnly?'교수님 강조 부분만':'전체 학습 내용',...content.map(c=>summaryOnly?summaryText(c.chapter.title,c.points):[c.chapter.title,...c.sections.map(s=>s.title+'\n'+s.blocks.map(blockText).join('\n\n')),c.points.length?summaryText(c.chapter.title,c.points):''].join('\n\n'))].join('\n\n');
   try{await navigator.clipboard.writeText(text);setMessage('현재 보이는 필기 내용을 복사했습니다.');}catch{setMessage('복사가 지원되지 않습니다. 필요한 문장을 선택해 복사해 주세요.');}
 };
 if(documentId&&!document)return <section className="panel empty"><h1>이 필기노트를 찾을 수 없습니다.</h1><Link to="/notebook">전체 필기노트 보기</Link></section>;
 const isIndex=!document&&!summaryOnly;
 return <div className={`notebook-page${summaryOnly?' summary-mode':''}`}>
  <div className="notebook-intro">{document&&<Link className="back-link" to="/notebook"><ArrowLeft size={15}/>전체 필기노트</Link>}<Heading eyebrow="WRITE IT DOWN · PDF 전체 정리" title={document?document.title+(summaryOnly?' · Summary':' · 필기노트'):summaryOnly?'모든 장 Summary':'필기할 문장만, 또렷하게.'} description="용어는 한 문장으로, 차이는 표로, 과정은 흐름으로. 형광펜이 없는 내용도 함께 정리했습니다."/></div>
  <nav className="notebook-book-tabs" aria-label="필기노트 자료 선택">{notebookDocuments.map(d=><Link key={d.id} className={`button${d.id===document?.id?' primary':''}`} to={`/notebook/${d.id}${summaryOnly?'?view=summary':''}`} aria-current={d.id===document?.id?'page':undefined}><span>{String(d.number).padStart(2,'0')}</span>{d.title}</Link>)}</nav>
  {isIndex?<>
   <section className="notebook-welcome panel"><div><span className="eyebrow">전체 학습 내용 + 교수님 강조</span><h2>긴 강의와 나란히 보는, 나의 필기본.</h2><p>PDF 4개·169쪽의 학습 내용을 새로 정리했습니다. <strong>노란 표시와 ★ 교수님 강조</strong>는 원본 형광펜을 대조한 부분입니다. 표시가 없는 내용도 모두 읽을 수 있습니다.</p><p>각 장 끝에는 핵심 문장만 모은 Summary가 있습니다. 원래 강의 설명과 수업 PDF도 그대로 볼 수 있습니다.</p></div><Link className="button primary" to="/notebook?view=summary">22개 장 Summary 모아보기<ArrowRight size={17}/></Link></section>
   <div className="notebook-card-grid">{notebookDocuments.map(d=><article className="panel notebook-card" key={d.id}><span className="eyebrow">NOTEBOOK {String(d.number).padStart(2,'0')}</span><h2>{d.title}</h2><p>{d.chapters.length}개 장 · 원본 {d.pageCount}쪽 · 형광펜 {d.highlightCount}곳</p><ul>{d.chapters.map(c=><li key={c.id}>{c.title}</li>)}</ul><div className="actions"><Link className="button primary" to={`/notebook/${d.id}`}><BookOpen size={16}/>전체 필기</Link><Link className="button" to={`/notebook/${d.id}?view=summary`}>Summary</Link></div></article>)}</div>
   <p className="notebook-scope-note">이 노트는 요청한 PDF 4개의 전체 학습 내용입니다. 현재 모의고사 5회차의 기준인 19쪽 최종 범위와는 구분합니다. <Link to="/guide">시험 범위 안내</Link> · <Link to="/lessons">자세한 강의노트</Link> · <Link to="/handouts">원본 자료실</Link></p>
  </>:<>
   <div className="notebook-toolbar"><div className="notebook-mode" aria-label="필기 보기 방식"><Link className={`button${!summaryOnly?' primary':''}`} to={document?root:'/notebook'}>전체 필기</Link><Link className={`button${summaryOnly?' primary':''}`} to={`${root}?view=summary`}>Summary만</Link></div><label className="notebook-search"><Search size={17}/><input aria-label="필기 내용 검색" placeholder="용어·코드·설명 검색" value={query} onChange={e=>change('q',e.target.value)}/></label><label className="checkbox-label notebook-highlight-toggle"><input type="checkbox" checked={teacherOnly} onChange={e=>change('highlight',e.target.checked?'1':'')}/>교수님 강조만</label><div className="notebook-output-actions"><button onClick={()=>void copy()} disabled={!content.length}><Copy size={15}/>필기 복사</button><button onClick={()=>window.print()}><Printer size={15}/>인쇄</button></div></div>
   <div role="status" aria-live="polite" className="notebook-feedback">{message||`${content.length}개 장 표시 · ${teacherOnly?'교수님 강조 보기':'일반 내용과 교수님 강조 모두 보기'}`}</div>
   <div className="notebook-layout"><div className="notebook-paper">{content.length?content.map(c=><ChapterView key={c.chapter.id} chapter={c.chapter} document={c.document} summaryOnly={summaryOnly} query={query} teacherOnly={teacherOnly}/>):<div className="empty"><h2>조건에 맞는 필기가 없습니다.</h2><button onClick={()=>setParams(summaryOnly?{view:'summary'}:{},{replace:true})}>검색·강조 조건 초기화</button></div>}</div><aside className="panel notebook-toc" aria-label="필기노트 목차"><button className="notebook-toc-toggle" aria-expanded={tocOpen} aria-controls="notebook-toc-list" onClick={()=>setTocOpen(!tocOpen)}><List size={17}/>이 노트의 목차<span>{tocOpen?'접기':'펼치기'}</span></button><nav id="notebook-toc-list" hidden={!tocOpen}>{content.map(c=><button key={c.chapter.id} onClick={()=>window.document.getElementById(c.chapter.id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{!document&&<small>{c.document.title}</small>}{c.chapter.title}</button>)}<Link to={`${root}?view=summary`}>Summary만 모아보기 →</Link><Link to="/lessons">자세한 강의노트 →</Link>{document&&<Link to={`/handouts/${document.id}`}>이 PDF 원본 보기 →</Link>}</nav></aside></div>
   <p className="notebook-scope-note">{document?`${document.filename}의 실제 PDF 쪽수로 연결합니다. 표지·반복 목차·연락처·빈 쪽은 학습 문장으로 복제하지 않았습니다.`:'각 자료의 장 구분에 맞춰 핵심 필기만 모았습니다.'} 교수님 강조는 실제 형광펜 표시를 뜻하며 출제를 보장하는 표시는 아닙니다.</p>
  </>}
 </div>;
}
