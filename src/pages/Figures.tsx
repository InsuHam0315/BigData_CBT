import {Link,useParams} from 'react-router-dom';
import {Heading} from '../components/UI';
import {SourceFigure,sourceFigures,sourceFigureMap,figureUrl} from '../components/SourceFigure';

export default function Figures(){
 const {figureId}=useParams();const figure=figureId?sourceFigureMap[figureId]:null;
 if(figureId&&!figure)return <div className="panel empty"><h1>이 그림을 찾을 수 없습니다.</h1><Link to="/figures">전체 원본 차트</Link></div>;
 if(figure)return <div className="figure-reader"><Link className="back-link" to="/figures">← 원본 차트 전체</Link><Heading eyebrow="READ THE ORIGINAL" title={figure.title} description="수업 PDF의 실제 그림입니다. 축·범례·집계 조건을 확인하는 순서로 읽어 보세요."/><SourceFigure id={figure.id}/><Link className="button" to={`/notebook/${figure.documentId}`}>이 자료 필기노트로 →</Link></div>;
 return <><Heading eyebrow="PDF CHART READER" title="원본 그림으로, 차근차근." description="넷플릭스 차트 17개와 환경·운영체제 그림 8개를 PDF에서 그대로 캡처했습니다. 차트마다 축·범례·읽는 순서와 해석의 한계를 설명합니다."/><div className="notice">그림을 새 데이터로 다시 그리지 않았습니다. 원문의 수치·설명에 불일치가 있으면 원본을 보존하고 아래 설명에서 구분합니다.</div><div className="figure-gallery">{sourceFigures.map(f=><article key={f.id} className="panel figure-card"><img src={figureUrl(f.asset)} width={f.width} height={f.height} loading="lazy" alt={`${f.title} 원본 캡처 미리보기`}/><h2>{f.title}</h2><p>{f.documentId==='netflix'?'Netflix':'빅데이터환경'} · PDF p{f.page}</p><p>{f.axes}</p><Link className="button" to={`/figures/${f.id}`}>그림 읽는 법 →</Link></article>)}</div></>;
}
