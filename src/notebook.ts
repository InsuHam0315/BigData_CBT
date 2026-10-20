import data from './content/notebook.json';

type Evidence = {pages: number[]; highlightIds: string[]};
export type NotePoint = Evidence & {term: string; meaning: string};
export type NoteBlock = Evidence & {id: string} & (
  {kind:'note';term:string;meaning:string;points:string[];correction?:{text:string;url:string|null}} |
  {kind:'table';title:string;columns:string[];rows:(Evidence&{cells:string[]})[];note:string} |
  {kind:'flow';title:string;steps:string[];note:string}
);
export type NoteSection={id:string;title:string;pages:number[];blocks:NoteBlock[]};
export type NoteChapter={id:string;title:string;sectionIds:string[];points:NotePoint[]};
export type NoteDocument={id:string;title:string;number:number;filename:string;sourceSha256:string;pageCount:number;highlightCount:number;sections:NoteSection[];chapters:NoteChapter[];excludedPages:{page:number;reason:string}[]};
export const notebookDocuments=data.documents as NoteDocument[];
export const notebookEdition=data.edition;

export function filterBlock(block:NoteBlock, query:string, teacherOnly:boolean):NoteBlock|null {
  const q=query.trim().toLocaleLowerCase('ko');
  const matches=(text:string)=>text.toLocaleLowerCase('ko').includes(q);
  if(block.kind==='table'){
    const titleMatches=!!q&&matches(block.title);
    const rows=block.rows.filter(r=>(!teacherOnly||block.highlightIds.length||r.highlightIds.length)&&(!q||titleMatches||matches(r.cells.join(' ')+' '+block.note)));
    return rows.length?{...block,rows}:null;
  }
  if(teacherOnly&&!block.highlightIds.length)return null;
  const text=block.kind==='note'?[block.term,block.meaning,...block.points,block.correction?.text??''].join(' '):[block.title,...block.steps,block.note].join(' ');
  return !q||matches(text)?block:null;
}

export function blockText(block:NoteBlock):string {
  const star=block.highlightIds.length?'[교수님 강조] ':'';
  if(block.kind==='note')return `${star}${block.term}: ${block.meaning}\n${block.points.map(p=>'- '+p).join('\n')}${block.correction?'\n- 바로잡기: '+block.correction.text:''}`;
  if(block.kind==='flow')return `${star}${block.title}: ${block.steps.join(' → ')}${block.note?'\n- '+block.note:''}`;
  return `${star}${block.title}\n${[block.columns.join(' | '),...block.rows.map(r=>(r.highlightIds.length?'[교수님 강조] ':'')+r.cells.join(' | '))].join('\n')}${block.note?'\n- '+block.note:''}`;
}

export function summaryText(title:string, points:NotePoint[]):string {
  return `${title} · Summary\n${points.map(p=>(p.highlightIds.length?'[교수님 강조] ':'')+p.term+': '+p.meaning).join('\n')}`;
}
