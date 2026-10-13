"""Original beginner-oriented lesson authoring; no source PDF text is copied.

Imported by generate_content.py so regeneration retains the full course.
"""
ENRICHMENT = {}


def add(id, intro, prerequisites, sections, checks, walkthrough, terms):
    blocks = []
    for block in sections.strip().split('## ')[1:]:
        heading, body = block.strip().split('\n', 1)
        blocks.append({'heading': heading, 'body': [p.strip() for p in body.split('\n\n') if p.strip()]})
    questions = []
    for line in checks.strip().splitlines():
        question, answer, explanation = line.split('|')
        questions.append(dict(question=question.strip(), answer=answer.strip(), explanation=explanation.strip()))
    ENRICHMENT[id] = dict(
        intro=intro, prerequisiteIds=prerequisites.split(), sections=blocks,
        selfChecks=questions, keyPoints=[q['answer'] for q in questions],
        walkthrough=[p.strip() for p in walkthrough.strip().split('\n\n') if p.strip()],
        terms=[[v.strip() for v in line.split('|')] for line in terms.strip().splitlines()],
    )


def apply_enrichment(lessons, cases, questions):
    from . import foundations, infrastructure, analysis, modeling  # noqa: F401
    from .labs import LABS
    from .course_focus import FOCUS, DIAGRAMS, ROUND_CASES
    assert set(ENRICHMENT) == set(FOCUS) == {l['id'] for l in lessons}
    for lesson in lessons:
        e = ENRICHMENT[lesson['id']]
        focus = FOCUS[lesson['id']]
        # Keep course explanations and two source-aligned interpretation blocks.
        # The general computer/Python introductions are deliberately not published.
        lesson['sections'] += [e['sections'][i] for i in focus['blocks']]
        for key in ('prerequisiteIds', 'selfChecks', 'keyPoints', 'walkthrough'):
            lesson[key] = e[key]
        lesson['intro'] = focus['summary']
        lesson['codeKind'] = 'diagram' if lesson['topic'] in 'ABCD' else 'python'
        if lesson['id'] in DIAGRAMS:
            lesson['code'], lesson['codeNotes'] = DIAGRAMS[lesson['id']]
        if lesson['id'] in {'E2', 'F1', 'F2', 'F3', 'H3', 'H4'}:
            lesson['microLab'] = LABS[lesson['id']]
            lesson['microLab']['kind'] = '수업 코드 확인용 축소 예제'
            if lesson['id'] == 'H4':
                lesson['microLab']['code'] = lesson['microLab']['code'].replace('from sklearn.pipeline import make_pipeline\n', '').replace('model = make_pipeline(TfidfVectorizer(), Ridge(alpha=1.0, solver=\'lsqr\'))\nmodel.fit(train_text, train_year)\npred = model.predict(test_text)', "vectorizer = TfidfVectorizer()\ntrain_vec = vectorizer.fit_transform(train_text)\ntest_vec = vectorizer.transform(test_text)\nmodel = Ridge(alpha=1.0, solver='lsqr').fit(train_vec, train_year)\npred = model.predict(test_vec)")
                lesson['microLab']['notes'][1] = 'TF-IDF와 Ridge를 학습 입력에서 fit하고 테스트 입력에는 동일한 변환기와 모델을 적용합니다.'
        lesson['workedExamples'] = []
        for cid in lesson['caseIds']:
            q = next(q for q in questions if q['caseId'] == cid and q['kind'] == 'numeric')
            conceptual = next(q for q in questions if q['caseId'] == cid and q['kind'] == 'choice')
            lesson['workedExamples'].append(dict(caseId=cid, calculationId=q['id'], conceptId=conceptual['id']))
        # Reading + tracing small examples; excludes a separate CBT attempt.
        chars = len(lesson['intro']) + sum(len(p) for s in lesson['sections'] for p in s['body'])
        lesson['minutes'] = max(15, round(chars / 140) + 6 * len(lesson['workedExamples']))
