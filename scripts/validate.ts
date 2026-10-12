import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { z } from "zod";
import {
  sources,
  topics,
  lessons,
  cases,
  questions,
  blueprints,
  caseMap,
  lessonMap,
  sourceMap,
  questionMap,
} from "../src/content";
import { calculate, selectQuestions } from "../src/engine";
const text = z.string().min(1),
  ids = z.array(text).min(1);
const ref = z.object({
  sourceId: text,
  pages: z.array(z.number().int().positive()).min(1),
});
const sourceSchema = z.object({
  id: text,
  filename: text,
  role: z.enum(["primary", "supplement"]),
  pages: z.number().int().positive(),
});
const topicSchema = z.object({
  id: z.enum(["A", "B", "C", "D", "E", "F", "G", "H"]),
  title: text,
  subtitle: text,
});
const lessonSchema = z.object({
  id: text,
  topic: text,
  title: text,
  objectives: ids,
  sections: z.array(z.object({ heading: text, body: ids })).min(2),
  terms: z.array(z.array(text).length(3)).min(3),
  code: text,
  codeNotes: ids,
  readOrder: ids,
  mistakes: ids,
  check: z.object({ question: text, answer: text }),
  caseIds: ids,
  sources: z.array(ref).min(1),
});
const caseSchema = z.object({
  id: text,
  title: text,
  scenario: text,
  unit: text,
  validN: z.number().positive(),
  columns: ids,
  rows: z
    .array(
      z.record(
        z.string(),
        z.union([z.string(), z.number().finite(), z.null()]),
      ),
    )
    .min(1),
  synthetic: z.literal(true),
  numericOrigin: text,
  assumptions: ids,
  exclusions: text,
  lessonId: text,
  questionIds: z.array(text).min(3).max(5),
  sources: z.array(ref).min(1),
});
const questionSchema = z.object({
  id: text,
  caseId: text,
  topic: text,
  kind: z.enum(["choice", "numeric", "short", "essay"]),
  stem: text,
  difficulty: z.enum(["기초", "보통", "심화"]),
  explanation: text,
  steps: ids,
  commonError: text,
  lessonId: text,
  origin: z.literal("직접 작성한 예상 연습문제"),
  sources: z.array(ref).min(1),
});
const unique = (list: { id: string }[], label: string) =>
  assert.equal(
    new Set(list.map((x) => x.id)).size,
    list.length,
    `${label} IDs`,
  );
for (const [schema, list] of [
  [sourceSchema, sources],
  [topicSchema, topics],
  [lessonSchema, lessons],
  [caseSchema, cases],
  [questionSchema, questions],
] as const)
  for (const x of list) schema.parse(x);
for (const [name, list] of [
  ["source", sources],
  ["topic", topics],
  ["lesson", lessons],
  ["case", cases],
  ["question", questions],
  ["blueprint", blueprints],
] as const)
  unique(list, name);
const checkRefs = (
  refs: { sourceId: string; pages: number[] }[],
  role: "primary" | "supplement",
) => {
  assert(refs.length || role === "supplement");
  for (const r of refs) {
    const s = sourceMap[r.sourceId];
    assert(s);
    assert.equal(s.role, role);
    assert(r.pages.every((p) => p >= 1 && p <= s.pages));
    if (s.id === "web3")
      assert(
        r.pages.every((p) => p >= 24),
        "Titanic-only pages excluded",
      );
  }
};
for (const l of lessons) {
  checkRefs(l.sources, "primary");
  checkRefs(l.supplements, "supplement");
  for (const c of l.caseIds) assert.equal(caseMap[c].lessonId, l.id);
  assert(
    l.sections.flatMap((s) => s.body).join("").length > 250,
    "substantive lesson",
  );
}
for (const c of cases) {
  checkRefs(c.sources, "primary");
  checkRefs(c.supplements, "supplement");
  assert(lessonMap[c.lessonId]);
  assert.equal(c.validN, c.rows.length);
  for (const r of c.rows) assert.deepEqual(Object.keys(r), c.columns);
  for (const id of c.questionIds) assert.equal(questionMap[id].caseId, c.id);
  if (c.chart) {
    const { x, y, series = [] } = c.chart;
    assert(c.columns.includes(x) && c.columns.includes(y));
    assert(series.every((k) => c.columns.includes(k)));
  }
}
let numeric = 0;
for (const q of questions) {
  checkRefs(q.sources, "primary");
  assert.equal(q.topic, caseMap[q.caseId].topic);
  assert(lessonMap[q.lessonId]);
  if (q.kind === "choice") {
    assert.equal(q.choices!.length, 4);
    unique(q.choices!, q.id);
    assert.equal(q.choices!.filter((c) => c.id === q.correctId).length, 1);
    assert(q.choices!.every((c) => c.text && c.reason));
  }
  if (q.kind === "numeric") {
    numeric++;
    assert.equal(typeof q.numeric!.unit, "string");
    assert(q.numeric!.tolerance >= 0);
    assert(
      Math.abs(
        calculate(caseMap[q.caseId].rows, q.numeric!.calculation) -
          q.numeric!.value,
      ) < 1e-8,
      q.id,
    );
  }
  if (q.kind === "short") assert(q.accepted!.length && q.modelAnswer);
  if (q.kind === "essay") assert(q.rubric!.length >= 2 && q.modelAnswer);
}
for (const b of blueprints) {
  assert(b.caseIds.every((id) => caseMap[id]));
  const result = selectQuestions({
    count: b.defaultCount,
    random: false,
    priority: b.caseIds,
  });
  assert.equal(result.ids.length, 40);
  for (const t of topics)
    assert.equal(
      result.ids.filter((id) => questionMap[id].topic === t.id).length,
      5,
    );
}
assert.equal(sources.filter((s) => s.role === "primary").length, 4);
assert.equal(sources.filter((s) => s.role === "supplement").length, 3);
assert(cases.length >= 30 && cases.length <= 40);
assert(questions.length >= 160 && questions.length <= 200);
assert(
  !/Titanic|타이타닉/.test(JSON.stringify({ lessons, cases, questions })),
  "supplement-only scope leak",
);
const by = (field: "kind" | "skill" | "topic") =>
  Object.fromEntries(
    [...new Set(questions.map((q) => q[field]))].map((k) => [
      k,
      questions.filter((q) => q[field] === k).length,
    ]),
  );
const report = {
  sources: sources.length,
  primary: 4,
  supplement: 3,
  lessons: lessons.length,
  cases: cases.length,
  questions: questions.length,
  numericRulesVerified: numeric,
  types: by("kind"),
  skills: by("skill"),
  topics: by("topic"),
  mockBlueprints: 3,
  status: "PASS",
};
writeFileSync(
  "docs/content-validation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
