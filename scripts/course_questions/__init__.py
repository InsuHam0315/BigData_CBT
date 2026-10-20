"""Original scenario questions grounded in the four annotated handouts."""
def V(stem,answer,explanation,*,figure=None,exhibit=None,options=None,pages=None,chapter=None):
 return dict(stem=stem,answer=answer,explanation=explanation,figure=figure,exhibit=exhibit,options=options,pages=pages,chapter=chapter)

def G(key,chapter,pages,marks,options,variants,*,skill='개념 적용',figure=None,difficulty='중하'):
 assert len(options)==4 and len(variants)==5
 return dict(key=key,chapter=chapter,pages=pages,marks=marks.split(),options=options,variants=variants,skill=skill,figure=figure,difficulty=difficulty)
