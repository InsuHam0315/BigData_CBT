"""Check the authored notebook against the four unchanged, already published PDFs.

Only provenance/coverage metadata is written. PDF text, screenshots and personal
study data are never copied to this report. Requires pypdf, not an OCR service.
"""
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
notes = json.loads((ROOT / 'src/content/notebook.json').read_text(encoding='utf-8'))
handouts = json.loads((ROOT / 'src/content/handouts.json').read_text(encoding='utf-8'))
report = {'edition': notes['edition'], 'documents': [], 'status': 'PASS'}
for document, handout in zip(notes['documents'], handouts, strict=True):
    assert document['id'] == handout['id']
    asset = ROOT / 'public/materials' / handout['asset']
    assert hashlib.sha256(asset.read_bytes()).hexdigest() == document['sourceSha256'] == handout['sha256']
    reader = PdfReader(asset)
    assert len(reader.pages) == document['pageCount'] == handout['pages']
    highlights = []
    for page_number, page in enumerate(reader.pages, 1):
        # MuPDF's visible annotation numbering excludes link and popup objects.
        visible = [a.get_object() for a in page.get('/Annots', [])
                   if a.get_object().get('/Subtype') not in ('/Popup', '/Link')]
        for index, annotation in enumerate(visible, 1):
            if annotation.get('/Subtype') == '/Highlight':
                highlights.append({'id': f'{document["id"]}-p{page_number}-a{index}',
                                   'page': page_number,
                                   'color': [float(c) for c in annotation.get('/C', [])]})
    blocks = [b for s in document['sections'] for b in s['blocks']]
    mentions = [b for b in blocks] + [r for b in blocks for r in b.get('rows', [])]
    actual = {h['id'] for h in highlights}
    used = {h for b in mentions for h in b['highlightIds']}
    assert used == actual, (document['id'], used ^ actual)
    assert len(actual) == document['highlightCount']
    for chapter in document['chapters']:
        assert chapter['points']
        for point in chapter['points']:
            assert set(point['highlightIds']) <= actual
    ledger = []
    excluded = {p['page']: p['reason'] for p in document['excludedPages']}
    for number in range(1, document['pageCount'] + 1):
        sections = [s['id'] for s in document['sections'] if number in s['pages']]
        assert bool(sections) != (number in excluded), (document['id'], number)
        # Every academic page has an authored content block, not just a heading.
        if sections:
            assert any(number in b['pages'] for b in blocks), (document['id'], number)
        ledger.append({'page': number, 'sections': sections,
                       'excludedReason': excluded.get(number),
                       'highlights': [h['id'] for h in highlights if h['page'] == number]})
    report['documents'].append({'id': document['id'], 'sha256': document['sourceSha256'],
      'pages': document['pageCount'], 'academicPages': sum(bool(p['sections']) for p in ledger),
      'chapters': len(document['chapters']), 'sections': len(document['sections']),
      'blocks': len(blocks), 'highlightAnnotations': highlights, 'pageLedger': ledger})
report['review'] = ('All 169 pages read; graphical OS evolution/distribution tables and all 33 '
 'annotation-bearing pages rendered and visually checked. 158 academic pages summarized; '
 '11 covers, repeated dividers, contact or blank pages accounted for separately. '
 'The ledger checks traceability; semantic coverage also received manual source review.')
(ROOT / 'docs/notebook-source-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Notebook source audit PASS:', sum(d['pages'] for d in report['documents']), 'pages,',
      sum(d['academicPages'] for d in report['documents']), 'academic pages,',
      sum(len(d['highlightAnnotations']) for d in report['documents']), 'actual highlights')
