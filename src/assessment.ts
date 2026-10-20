export type AssessmentSection = 'cbt' | 'mock';

/** A round belongs to its source, regardless of the mode used in an older URL. */
export function roundSection(roundId: string): AssessmentSection | null {
  if (/^final-[1-5]$/.test(roundId)) return 'cbt';
  if (/^course-[1-5]$/.test(roundId)) return 'mock';
  return null;
}

export function roundStartPath(roundId: string, fallback: AssessmentSection = 'cbt') {
  return `/${roundSection(roundId) ?? fallback}/${roundId}`;
}

export function assessmentEntryPath(section: AssessmentSection, roundId?: string, search = '') {
  if (roundId) return roundStartPath(roundId, section);
  // Both old concept links referred to the 19-page PDF. Preserve that source.
  return new URLSearchParams(search).get('scope') === 'concept' ? '/cbt' : `/${section}`;
}

export function questionSection(ids: string[]): AssessmentSection | null {
  if (ids.length && ids.every(id => /^F(?:26R)?\d{2}Q\d{2}$/.test(id))) return 'cbt';
  if (ids.length && ids.every(id => /^C26(?:V2)?R\d{2}Q\d{2}$/.test(id))) return 'mock';
  return null;
}
