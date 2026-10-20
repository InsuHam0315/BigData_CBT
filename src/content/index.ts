import sourceData from "./sources.json";
import topicData from "./topics.json";
import lessonData from "./lessons.json";
import caseData from "./cases.json";
import questionData from "./questions.json";
import blueprintData from "./blueprints.json";
import { finalSources, finalTopics, finalLessons, finalCases, finalQuestions, finalBlueprints, archivedFinalQuestions } from './final';
export * from './final';
import {courseSources,courseTopics,courseLessons,courseCases,courseQuestions,courseBlueprints,archivedCourseQuestions} from './course';
export * from './course';
import type {
  Source,
  Topic,
  Lesson,
  CaseStudy,
  Question,
  ExamBlueprint,
} from "../types";
export const sources = sourceData as Source[];
export const topics = topicData as Topic[];
export const lessons = lessonData as Lesson[];
export const cases = caseData as CaseStudy[];
export const questions = questionData as Question[];
export const blueprints = blueprintData as ExamBlueprint[];
export const allLessons = [...courseLessons,...finalLessons, ...lessons];
export const allCases = [...courseCases,...finalCases, ...cases];
export const allQuestions = [...courseQuestions,...finalQuestions, ...questions];
// Archived IDs stay available to saved drafts, results, bookmarks and backups.
// New chapter/case practice uses allQuestions and never reintroduces old items.
export const reviewQuestions = [...allQuestions, ...archivedFinalQuestions, ...archivedCourseQuestions];
export const allTopics = [...courseTopics,...finalTopics, ...topics.map(t=>({...t,title:`이전 자료 · ${t.title}`}))];
export const allBlueprints = [...courseBlueprints,...finalBlueprints, ...blueprints];
export const lessonMap = Object.fromEntries(allLessons.map((l) => [l.id, l]));
export const caseMap = Object.fromEntries(allCases.map((c) => [c.id, c]));
export const questionMap = Object.fromEntries(reviewQuestions.map((q) => [q.id, q]));
export const sourceMap = Object.fromEntries([...sources,...finalSources,...courseSources].map((s) => [s.id, s]));
