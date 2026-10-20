"""Authored, concise study notes. Raw PDF extraction stays in ignored tmp/."""
def N(term, meaning, *points, p=None, hi='', correction=None):
    result = dict(kind='note', term=term, meaning=meaning, points=list(points))
    if p is not None: result['pages'] = p if isinstance(p, list) else [p]
    if hi: result['marks'] = hi.split()
    if correction: result['correction'] = correction
    return result

def R(*cells, hi=''):
    return dict(cells=list(cells), marks=hi.split())

def T(title, columns, rows, *, p=None, hi='', note=''):
    result = dict(kind='table', title=title, columns=columns, rows=[r if isinstance(r, dict) else R(*r) for r in rows], note=note, marks=hi.split())
    if p is not None: result['pages'] = p if isinstance(p, list) else [p]
    return result

def F(title, steps, note='', *, p=None, hi=''):
    result = dict(kind='flow', title=title, steps=steps, note=note, marks=hi.split())
    if p is not None: result['pages'] = p if isinstance(p, list) else [p]
    return result

def S(first, last, title, *blocks):
    return dict(title=title, pages=list(range(first,last+1)), blocks=list(blocks))
