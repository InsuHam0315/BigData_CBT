import sourceData from "./sources.json";
import topicData from "./topics.json";
import lessonData from "./lessons.json";
import caseData from "./cases.json";
import questionData from "./questions.json";
import blueprintData from "./blueprints.json";
import { finalSources, finalTopics, finalLessons, finalCases, finalQuestions, finalBlueprints } from './final';
export * from './final';
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
export const allLessons = [...finalLessons, ...lessons];
export const allCases = [...finalCases, ...cases];
export const allQuestions = [...finalQuestions, ...questions];
export const allTopics = [...finalTopics, ...topics.map(t=>({...t,title:`이전 자료 · ${t.title}`}))];
export const allBlueprints = [...finalBlueprints, ...blueprints];
export const lessonMap = Object.fromEntries(allLessons.map((l) => [l.id, l]));
export const caseMap = Object.fromEntries(allCases.map((c) => [c.id, c]));
export const questionMap = Object.fromEntries(allQuestions.map((q) => [q.id, q]));
export const sourceMap = Object.fromEntries([...sources,...finalSources].map((s) => [s.id, s]));
