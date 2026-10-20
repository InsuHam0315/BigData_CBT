import {describe, expect, it} from 'vitest';
import {assessmentEntryPath, questionSection, roundStartPath} from '../src/assessment';
import {finalBlueprints, courseBlueprints, questionMap} from '../src/content';
import {newDraft, roundQuestions} from '../src/engine';

describe('separate CBT and mock source banks', () => {
  it('starts CBT from the 19-page PDF and mocks from the four annotated PDFs', () => {
    expect(assessmentEntryPath('cbt')).toBe('/cbt');
    expect(assessmentEntryPath('mock')).toBe('/mock');
    const cbtIds = finalBlueprints.flatMap(roundQuestions);
    const mockIds = courseBlueprints.flatMap(roundQuestions);
    expect(cbtIds).toHaveLength(200);
    expect(mockIds).toHaveLength(200);
    expect(cbtIds.filter(id => mockIds.includes(id))).toEqual([]);
    expect(cbtIds.every(id => questionMap[id].sources.every(s => s.sourceId === 'FINAL19'))).toBe(true);
    expect(mockIds.every(id => questionMap[id].sources.every(s => s.sourceId !== 'FINAL19'))).toBe(true);
    const practice = newDraft('test', 'practice', 'CBT', roundQuestions(finalBlueprints[0]), 60, false);
    const exam = newDraft('test', 'exam', '모의고사', roundQuestions(courseBlueprints[0]), 60, false);
    expect(questionSection(practice.questionIds)).toBe('cbt');
    expect(practice.endsAt).toBeNull();
    expect(questionSection(exam.questionIds)).toBe('mock');
    expect(exam.endsAt).not.toBeNull();
  });
  it('keeps each old round URL and retake link attached to its original source', () => {
    for (let i=1; i<=5; i++) {
      expect(assessmentEntryPath('mock', `final-${i}`)).toBe(`/cbt/final-${i}`);
      expect(assessmentEntryPath('cbt', `course-${i}`)).toBe(`/mock/course-${i}`);
      expect(roundStartPath(`final-${i}`, 'mock')).toBe(`/cbt/final-${i}`);
      expect(roundStartPath(`course-${i}`, 'cbt')).toBe(`/mock/course-${i}`);
    }
    expect(assessmentEntryPath('mock', undefined, '?scope=concept')).toBe('/cbt');
    expect(assessmentEntryPath('cbt', undefined, '?scope=concept')).toBe('/cbt');
    expect(assessmentEntryPath('mock', 'mock-1')).toBe('/mock/mock-1');
    expect(assessmentEntryPath('cbt', 'not-a-round')).toBe('/cbt/not-a-round');
  });
  it('identifies saved editions by their questions without rewriting IDs or modes', () => {
    expect(questionSection(['F01Q01', 'F05Q40'])).toBe('cbt');
    expect(questionSection(['F26R01Q01', 'F26R05Q40'])).toBe('cbt');
    expect(questionSection(['C26R01Q01', 'C26R05Q40'])).toBe('mock');
    expect(questionSection(['C26V2R01Q01', 'C26V2R05Q40'])).toBe('mock');
    expect(questionSection(['F01Q01', 'C26R01Q01'])).toBeNull();
    expect(questionSection([])).toBeNull();
  });
});
