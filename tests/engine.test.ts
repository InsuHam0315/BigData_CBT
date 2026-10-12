import { describe, it, expect } from "vitest";
import { questions, questionMap, cases, blueprints } from "../src/content";
import {
  grade,
  newDraft,
  scoreDraft,
  selectQuestions,
  shuffle,
  topicStats,
} from "../src/engine";
describe("grading and case extraction", () => {
  it("grades IDs after shuffling and rejects displayed numbers", () => {
    for (const q of questions.filter((q) => q.kind === "choice")) {
      const shuffled = shuffle(q.choices!, () => 0.2);
      expect(new Set(shuffled.map((x) => x.id)).size).toBe(4);
      expect(grade(q, q.correctId)).toBe(true);
      expect(grade(q, "1")).toBe(false);
      expect(grade(q, q.choices!.find((c) => c.id !== q.correctId)!.id)).toBe(
        false,
      );
    }
  });
  it("handles numeric tolerance, valid zero, units and invalid strings", () => {
    const q = questions.find((q) => q.kind === "numeric")!;
    expect(grade(q, String(q.numeric!.value))).toBe(true);
    expect(grade(q, String(q.numeric!.value + 0.009))).toBe(true);
    expect(grade(q, String(q.numeric!.value + 0.02))).toBe(false);
    for (const v of ["", "NaN", "Infinity", "10ms", "1,000"])
      expect(grade(q, v)).toBe(false);
    const zero = { ...q, numeric: { ...q.numeric!, value: 0 } };
    expect(grade(zero, "0")).toBe(true);
  });
  it("normalizes short answers, leaves essays pending and treats blanks as wrong", () => {
    const q = questions.find((q) => q.kind === "short")!,
      e = questions.find((q) => q.kind === "essay")!;
    expect(grade(q, " " + q.accepted![0] + " ")).toBe(true);
    expect(grade(q, "unrelated")).toBe(false);
    expect(grade(e, "근거 있는 서술")).toBe(null);
    expect(grade(e, "근거 있는 서술", true)).toBe(true);
    expect(grade(e, "", true)).toBe(false);
  });
  it("retains cases, balances A-H and has no duplicates for 3 mocks", () => {
    for (const b of blueprints) {
      const { ids } = selectQuestions({
        count: 40,
        random: false,
        priority: b.caseIds,
      });
      expect(ids).toHaveLength(40);
      expect(new Set(ids).size).toBe(40);
      for (const t of "ABCDEFGH")
        expect(ids.filter((id) => questionMap[id].topic === t)).toHaveLength(5);
      for (const c of new Set(ids.map((id) => questionMap[id].caseId))) {
        const indices = ids.flatMap((id, i) =>
          questionMap[id].caseId === c ? [i] : [],
        );
        expect(indices.at(-1)! - indices[0] + 1).toBe(indices.length);
      }
    }
  });
  it("returns limited honest counts, empty pool, and stable draft choice orders", () => {
    expect(selectQuestions({ pool: [], count: 40 }).ids).toEqual([]);
    const pool = questions.filter((q) => q.caseId === cases[0].id);
    expect(selectQuestions({ pool, count: 40 }).ids).toHaveLength(5);
    expect(selectQuestions({ pool, count: 3 }).ids).toHaveLength(3);
    const d = newDraft(
      "test",
      "exam",
      "test",
      pool.map((q) => q.id),
      60,
    );
    expect(JSON.parse(JSON.stringify(d)).choiceOrders).toEqual(d.choiceOrders);
  });
  it("scores unanswered + pending essays explicitly; unattempted topics are absent", () => {
    const c = questions.find((q) => q.kind === "choice")!,
      e = questions.find((q) => q.kind === "essay")!;
    const d = newDraft("test", "practice", "test", [c.id, e.id], 60);
    d.answers[e.id] = "해석";
    const a = scoreDraft(d);
    expect(a.correct).toBe(0);
    expect(a.pending).toBe(1);
    expect(a.score).toBe(null);
    expect(topicStats([])).toEqual({});
  });
});
