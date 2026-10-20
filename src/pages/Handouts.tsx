import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Download, ExternalLink, FileText } from 'lucide-react';
import handouts from '../content/handouts.json';
import { lessonMap } from '../content';
import { Heading } from '../components/UI';

export const handoutUrl = (asset: string) => `${import.meta.env.BASE_URL}materials/${asset}`;
const size = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function RelatedHandouts({lessonId}: {lessonId: string}) {
  const related = handouts.filter(d => d.relatedLessons.includes(lessonId));
  return <section className="related-handouts"><h2>함께 볼 수업 필기본</h2><p className="muted">형광펜·손글씨·메모가 포함된 제공 자료입니다.</p><div className="actions">{related.map(d=><Link key={d.id} className="button" to={`/handouts/${d.id}`}><FileText size={16}/>{d.number}. {d.title}</Link>)}</div></section>;
}

export function HandoutHomeLink() {
  return <section className="panel handouts-announcement"><div><span className="eyebrow">수업 필기본 추가</span><h2>수업 때 표시한 내용도 함께 보기.</h2><p>개요·빅데이터·인프라·Netflix 필기본 4개, 총 169쪽을 원본 그대로 볼 수 있어요.</p></div><div className="actions"><Link className="button primary" to="/notebook"><BookOpen size={17}/>필기용 핵심노트·Summary</Link><Link className="button" to="/handouts"><FileText size={17}/>필기자료실<ArrowRight size={16}/></Link></div></section>;
}

export function Handouts() {
  const {documentId} = useParams();
  const [params,setParams] = useSearchParams();
  const [preview,setPreview] = useState(false);
  const document = handouts.find(d=>d.id===documentId);
  if(documentId&&!document)return <section className="empty panel"><h1>필기자료를 찾을 수 없습니다.</h1><Link className="button" to="/handouts">필기자료실로</Link></section>;
  if(!document)return <>
    <Heading eyebrow="LECTURE HANDOUTS" title="수업 필기자료실" description="제공한 필기본 4개를 원본 그대로 모았습니다. 형광펜·손글씨·텍스트 메모와 표·그림을 함께 확인하세요."/>
    <div className="scope-facts"><span>PDF 4개</span><span>전체 169쪽</span><span>원본 보기·다운로드</span><span>필기 있는 쪽 바로가기</span></div>
    <div className="handout-grid">{handouts.map(d=><article className="panel handout-card" key={d.id}><div className="handout-number"><FileText size={22}/><span>{String(d.number).padStart(2,'0')}</span></div><h2>{d.title}</h2><p>{d.description}</p><div className="tags"><span className="tag">{d.pages}쪽</span><span className="tag">{size(d.bytes)}</span><span className="tag">필기 표시 {d.annotatedPages.length}쪽</span></div><div className="actions"><Link className="button primary" to={`/handouts/${d.id}`}>필기본 보기<ArrowRight size={16}/></Link><a className="button" href={handoutUrl(d.asset)} download={d.filename}><Download size={16}/>다운로드</a><Link className="button" to={`/notebook/${d.id}`}>핵심 필기·Summary</Link></div><small className="muted handout-filename">{d.filename}</small></article>)}</div>
    <section className="notice">모의고사 5회차는 이 PDF 4개 전체를 기준으로 합니다. CBT는 별도 자료인 빅데이터1-3장.pdf에서 출제합니다. 형광펜 강조 개념의 비중을 높이고 원본 차트를 문항 안에 제공합니다. <Link to="/guide">시험 범위 안내 →</Link></section>
  </>;
  const requested=params.get('page')??'1';
  const parsed=/^\d+$/.test(requested)?Number(requested):1;
  const page=Number.isSafeInteger(parsed)?Math.min(document.pages,Math.max(1,parsed)):1;
  const url=`${handoutUrl(document.asset)}#page=${page}&view=FitH`;
  const selectPage=(next:number)=>{setParams({page:String(next)});setPreview(true);};
  return <>
    <Link className="back-link" to="/handouts"><ArrowLeft size={15}/>필기자료실</Link>
    <Heading eyebrow={`HANDOUT ${document.number} · 원본 필기 PDF`} title={document.title} description={document.description}/>
    <p className="muted handout-filename">{document.filename} · {document.pages}쪽 · {size(document.bytes)}</p>
    <div className="actions handout-actions"><Link className="button" to={`/notebook/${document.id}`}><BookOpen size={16}/>이 PDF 핵심 필기·Summary</Link><a className="button primary" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>새 탭에서 원본 보기</a><a className="button" href={handoutUrl(document.asset)} download={document.filename}><Download size={16}/>원본 다운로드</a><Link className="button" to="/lessons"><BookOpen size={16}/>19쪽 보충 강의</Link></div>
    <div className="handout-layout"><div className="handout-main">
      <section className="panel handout-preview"><div className="section-title"><h2>PDF 미리보기</h2><button aria-expanded={preview} aria-controls="handout-pdf" onClick={()=>setPreview(!preview)}>{preview?'미리보기 접기':'여기서 미리보기'}</button></div><div className="handout-page-controls"><button disabled={page===1} onClick={()=>selectPage(page-1)} aria-label="이전 PDF 쪽"><ArrowLeft size={15}/></button><label>PDF 쪽<select aria-label="PDF 쪽" value={page} onChange={e=>selectPage(Number(e.target.value))}>{Array.from({length:document.pages},(_,i)=><option key={i} value={i+1}>{i+1} / {document.pages}</option>)}</select></label><button disabled={page===document.pages} onClick={()=>selectPage(page+1)} aria-label="다음 PDF 쪽"><ArrowRight size={15}/></button><a className="text-link" href={url} target="_blank" rel="noopener noreferrer">선택한 쪽 새 탭에서 보기 ↗</a></div><p className="muted">브라우저의 PDF 뷰어로 표시합니다. 미리보기가 보이지 않으면 위의 원본 보기나 다운로드를 이용하세요.</p><div id="handout-pdf" hidden={!preview}>{preview&&<iframe key={`${document.id}-${page}`} title={`${document.title} 원본 PDF · ${page}쪽`} src={url}/>}</div></section>
      <section className="panel handout-annotations"><h2>필기 표시가 있는 쪽</h2><p>PDF에 형광펜·손글씨·메모가 저장된 쪽입니다. 시험 출제 여부를 표시하는 목록은 아닙니다.</p><div className="handout-page-links">{document.annotatedPages.map(n=><button key={n} aria-pressed={page===n} onClick={()=>selectPage(n)}>p{n}</button>)}</div>{document.textNotes.length>0&&<><h3>PDF의 텍스트 메모</h3><ul>{document.textNotes.map((n,i)=><li key={i}><button className="text-link" onClick={()=>selectPage(n.page)}>p{n.page}</button> · {n.text}</li>)}</ul></>}</section>
      <section className="notice">제공된 원본을 그대로 표시합니다. PDF 전체 노트와 새 종합 문제는 <Link to="/notebook">전체 필기 학습실</Link>에서 이어서 볼 수 있습니다.</section>
    </div><aside className="panel handout-toc" aria-label="필기본 목차"><h2>내용 바로가기</h2>{document.contents.map(c=><button key={c.page} onClick={()=>selectPage(c.page)}><span>p{c.page}</span>{c.title}</button>)}<h3>연결 필기노트</h3>{document.relatedLessons.map(id=><Link key={id} to={`/lessons/${id}`}>{lessonMap[id].title} →</Link>)}</aside></div>
  </>;
}
