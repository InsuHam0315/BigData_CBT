import {describe,it,expect} from 'vitest';
import {notebookDocuments,filterBlock,blockText,summaryText,type NoteBlock} from '../src/notebook';

const blocks=notebookDocuments.flatMap(d=>d.sections.flatMap(s=>s.blocks));
describe('notebook source distinctions and study filters',()=>{
 it('keeps the two unhighlighted Vs when reading all content and marks only the actual 3V selection',()=>{
  const table=blocks.find(b=>b.kind==='table'&&b.rows.some(r=>r.cells.some(c=>c.includes('Veracity'))))!;
  expect(table.kind).toBe('table');
  if(table.kind!=='table')throw Error('5V table missing');
  expect(table.rows).toHaveLength(5);
  expect(table.rows.filter(r=>r.highlightIds.length)).toHaveLength(3);
  const filtered=filterBlock(table,'',true);
  expect(filtered?.kind).toBe('table');
  if(filtered?.kind==='table')expect(filtered.rows.map(r=>r.cells[0]).join(' ')).not.toMatch(/Veracity|Value/);
  expect(filterBlock(table,'veracity',false)).not.toBeNull();
  expect(filterBlock(table,'veracity',true)).toBeNull();
 });
 it('combines teacher and query conditions, includes explanation text, and handles whitespace',()=>{
  const marked=blocks.find(b=>b.kind==='note'&&b.term==='가상메모리')!;
  expect(filterBlock(marked,'  스왑  ',true)).toEqual(marked);
  expect(filterBlock(marked,'없는 검색어',true)).toBeNull();
  const plain=blocks.find(b=>b.kind==='note'&&!b.highlightIds.length)!;
  expect(filterBlock(plain,'',false)).toEqual(plain);
  expect(filterBlock(plain,'',true)).toBeNull();
 });
 it('exports concise content with explicit emphasis and correction, without UI or account data',()=>{
  const corrected=blocks.find(b=>b.kind==='note'&&b.correction)!;
  expect(blockText(corrected)).toContain('바로잡기:');
  const flow=blocks.find(b=>b.kind==='flow')!;
  expect(blockText(flow)).toContain(' → ');
  const table=blocks.find(b=>b.kind==='table'&&b.rows.some(r=>r.highlightIds.length))!;
  expect(blockText(table)).toContain('[교수님 강조]');
  const chapter=notebookDocuments[0].chapters[0];
  expect(summaryText(chapter.title,chapter.points)).toContain(' · Summary\n');
  expect(summaryText(chapter.title,chapter.points)).toContain(chapter.points[0].term+': ');
 });
 it('keeps source inconsistencies visible rather than inventing one agreed metric',()=>{
  const all=blocks.map(blockText).join('\n');
  expect(all).toContain('4.19');expect(all).toContain('4.83');expect(all).toContain('NaN');
  expect(all).toContain('7,770');expect(all).toContain('7,787');expect(all).toContain('가상 데이터');
  expect(all).toContain('위쪽');
 });
 it('does not mutate source rows while searching or selecting teacher material',()=>{
  const original=JSON.stringify(blocks);
  for(const b of blocks){filterBlock(b,'데이터',false);filterBlock(b,'',true);}
  expect(JSON.stringify(blocks)).toBe(original);
  expect(blocks.map(b=>filterBlock(b,'절대없는검색XYZ',false)).filter((b):b is NoteBlock=>b!==null)).toEqual([]);
 });
});
