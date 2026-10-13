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
    assert set(ENRICHMENT) == {l['id'] for l in lessons}
    for lesson in lessons:
        e = ENRICHMENT[lesson['id']]
        lesson['microLab'] = LABS[lesson['id']]
        # Establish vocabulary before the original compact explanations.
        lesson['sections'] = [e['sections'][0], *lesson['sections'], *e['sections'][1:]]
        for key in ('intro', 'prerequisiteIds', 'selfChecks', 'keyPoints', 'walkthrough'):
            lesson[key] = e[key]
        known = {row[0] for row in lesson['terms']}
        lesson['terms'] += [row for row in e['terms'] if row[0] not in known]
        lesson['workedExamples'] = []
        for cid in lesson['caseIds']:
            q = next(q for q in questions if q['caseId'] == cid and q['kind'] == 'numeric')
            conceptual = next(q for q in questions if q['caseId'] == cid and q['kind'] == 'choice')
            lesson['workedExamples'].append(dict(caseId=cid, calculationId=q['id'], conceptId=conceptual['id']))
        # Reading + tracing small examples; excludes a separate CBT attempt.
        chars = len(lesson['intro']) + sum(len(p) for s in lesson['sections'] for p in s['body'])
        lesson['minutes'] = max(20, round(chars / 95) + 8 * len(lesson['workedExamples']))
