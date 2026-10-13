"""Execute the course's authored synthetic Python labs and inspect course growth.

Only repository-authored microLab code is executed. No PDFs, accounts, network
requests, or learner records are read. Install requirements-lessons.txt first.
"""
import contextlib
import io
import json
import platform
import hashlib
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import sklearn

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
lessons = json.loads((root / 'src/content/lessons.json').read_text(encoding='utf-8'))
baseline = json.loads((root / 'docs/lesson-baseline.json').read_text(encoding='utf-8'))
before = baseline['bodyChars']
for name, expected in baseline['unchangedContentSha256'].items():
    data = json.loads((root / f'src/content/{name}.json').read_text(encoding='utf-8'))
    digest = hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()
    assert digest == expected, f'{name}: existing content/IDs/answers must remain unchanged'
report = []
for lesson in lessons:
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        exec(compile(lesson['microLab']['code'], f"lesson:{lesson['id']}", 'exec'), {})
    actual = output.getvalue().strip()
    assert actual == lesson['microLab']['output'], (lesson['id'], actual, lesson['microLab']['output'])
    chars = sum(len(p) for s in lesson['sections'] for p in s['body'])
    report.append(dict(id=lesson['id'], sections=len(lesson['sections']), bodyBefore=before[lesson['id']],
        bodyAfter=chars, growth=round(chars / before[lesson['id']], 2),
        workedCases=len(lesson['workedExamples']), selfChecks=len(lesson['selfChecks']), lab='PASS'))
result = dict(python=platform.python_version(), numpy=np.__version__, pandas=pd.__version__,
    sklearn=sklearn.__version__, labsPassed=len(report), lessons=report)
(root / 'docs/lesson-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f"PASS: {len(report)} executable lesson labs; Python {result['python']}, Pandas {pd.__version__}, scikit-learn {sklearn.__version__}")
print(f"Body characters: {sum(before.values())} → {sum(r['bodyAfter'] for r in report)}")
