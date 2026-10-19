"""Import the four user-requested annotated PDFs byte for byte.

No PDF commands, scripts, or embedded links are executed. Run locally with the
source folder as the first argument; the deployed app needs no PDF tooling.
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
SPECS = [
    ('environment', '1.빅데이터환경_개요_필기본.pdf', '빅데이터환경 개요',
     '소프트웨어·운영체제·프로세스·메모리·파일시스템 필기본', ['FN1', 'FN2'],
     [(1, '과목 개요·목차'), (6, '소프트웨어'), (12, '운영체제'), (32, '프로그램·프로세스'), (41, '메모리 관리'), (50, '파일·파일시스템'), (62, '리눅스 배포판')]),
    ('bigdata', '2.빅데이터란_필기본.pdf', '빅데이터란?',
     '빅데이터 개념·5V·예시·역사·활용·데이터 형태 필기본', ['FN2'],
     [(1, '개념과 정의'), (2, '5V'), (4, '데이터 예시'), (6, '역사적 발전'), (9, '응용 분야'), (11, '데이터의 형태')]),
    ('infrastructure', '3.인프라_필기본.pdf', '빅데이터 인프라',
     '하드웨어·수집·저장·품질 관리·거버넌스와 보안 필기본', ['FN2'],
     [(1, '하드웨어 인프라'), (6, '데이터 수집'), (13, '저장 시스템'), (18, '데이터 품질 관리'), (22, '거버넌스와 보안')]),
    ('netflix', '4.넷플릭스_필기본.pdf', 'Netflix 데이터 분석',
     '분석 개요부터 전처리·EDA·시각화·심화 분석까지의 필기본', ['FN3'],
     [(1, '분석 개요'), (4, '실습 환경'), (7, '데이터 전처리'), (12, '탐색적 분석(EDA)'), (19, '시각화'), (32, '관계 분석'), (40, '네트워크 분석'), (46, '텍스트 마이닝'), (53, '콘텐츠 기반 추천'), (56, '협업 필터링'), (61, '머신러닝 적용')]),
]

def main():
    source_folder = Path(sys.argv[1]).resolve()
    destination = ROOT / 'public/materials'
    destination.mkdir(parents=True, exist_ok=True)
    result = []
    for number, (key, filename, title, description, related, contents) in enumerate(SPECS, 1):
        original = source_folder / filename
        data = original.read_bytes()
        pdf = pymupdf.open(original)
        annotated = []
        notes = []
        annotation_count = 0
        for i, page in enumerate(pdf, 1):
            annotations = list(page.annots() or [])
            if annotations:
                annotated.append(i)
            annotation_count += len(annotations)
            for annotation in annotations:
                text = annotation.info.get('content', '').strip()
                if text:
                    notes.append({'page': i, 'text': text})
        asset = f'lecture-{number:02d}-notes.pdf'
        shutil.copyfile(original, destination / asset)
        assert (destination / asset).read_bytes() == data
        result.append(dict(id=key, number=number, title=title, filename=filename,
                           description=description, asset=asset, pages=len(pdf),
                           bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                           annotatedPages=annotated, annotationCount=annotation_count,
                           textNotes=notes, relatedLessons=related,
                           contents=[{'page': p, 'title': t} for p, t in contents]))
    (ROOT / 'src/content/handouts.json').write_bytes(
        (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    print(f'Imported {len(result)} annotated originals, {sum(d["pages"] for d in result)} pages; bytes unchanged')

if __name__ == '__main__':
    main()
