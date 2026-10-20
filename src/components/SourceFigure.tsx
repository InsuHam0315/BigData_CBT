import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {Expand,X,FileText} from 'lucide-react';
import data from '../content/source-figures.json';
import './SourceFigure.css';

export const sourceFigures=data;
export const sourceFigureMap=Object.fromEntries(data.map(f=>[f.id,f]));
export const figureUrl=(asset:string)=>`${import.meta.env.BASE_URL}figures/${asset}`;
export function SourceFigure({id,mode='study'}:{id:string;mode?:'study'|'question'}){
 const figure=sourceFigureMap[id];const dialog=useRef<HTMLDialogElement>(null);
 if(!figure)return null;
 const alt=`${figure.title}. ${figure.axes}. 원본 PDF ${figure.page}쪽 캡처.`;
 return <figure className={`source-figure ${mode==='question'?'question-source-figure':''}`} data-figure-id={id}>
  <figcaption><span className="eyebrow">PDF 원본 캡처</span><h4>{figure.title}</h4><p>{figure.axes}</p></figcaption>
  <div className="source-figure-image"><img src={figureUrl(figure.asset)} width={figure.width} height={figure.height} alt={alt} loading="lazy" decoding="async"/></div>
  <div className="source-figure-tools"><button type="button" aria-label={`${figure.title} 크게 보기`} onClick={()=>dialog.current?.showModal()}><Expand size={15}/>크게 보기</button><Link to={`/handouts/${figure.documentId}?page=${figure.page}`}><FileText size={14}/>원본 PDF p{figure.page} ↗</Link></div>
  {mode==='study'&&<div className="source-figure-reading"><h5>이렇게 읽어요</h5><ol>{figure.steps.map(step=><li key={step}>{step}</li>)}</ol><p className="figure-takeaway"><strong>읽은 뒤 남길 문장: </strong>{figure.takeaway}</p>{figure.caution&&<p className="figure-caution"><strong>원문을 볼 때 주의: </strong>{figure.caution}</p>}</div>}
  <dialog ref={dialog} aria-label={`${figure.title} 확대 보기`} className="source-image-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><div className="source-dialog-toolbar"><strong>{figure.title} · PDF p{figure.page}</strong><button type="button" aria-label="확대 이미지 닫기" onClick={()=>dialog.current?.close()}><X size={19}/></button></div><p>작은 글씨는 그림 안을 가로·세로로 밀어 읽으세요.</p><div className="source-dialog-image" tabIndex={0} role="region" aria-label={`${figure.title} 확대 그림`}><img src={figureUrl(figure.asset)} width={figure.width} height={figure.height} style={{minWidth:Math.min(1100,figure.width)}} alt={alt} loading="lazy"/></div><p>{figure.axes}</p></dialog>
 </figure>;
}
