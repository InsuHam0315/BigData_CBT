import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import {
  emptyProfile,
  getProfile,
  register,
  login,
  updateProfile,
  patchDraft,
  submitDraft,
  evaluateEssay,
  toggleBookmark,
  readLesson,
  exportBackup,
  validateBackup,
  importBackup,
  migrateGuest,
  openDB,
} from "../src/storage";
import { newDraft } from "../src/engine";
import { questions } from "../src/content";
describe("atomic owner-scoped persistence", () => {
  it("uses unique local identities, PBKDF2 salts and never stores plaintext", async () => {
    const a = await register("qa_user_a", "검증 A", "test-pass-123"),
      b = await register("qa_user_b", "검증 B", "test-pass-123");
    expect(a.userId).not.toBe(b.userId);
    expect(await login(" QA_USER_A ", "test-pass-123")).toEqual(a);
    await expect(login("qa_user_a", "incorrect")).rejects.toThrow("올바르지");
    await expect(
      register("qa_user_a", "중복", "test-pass-123"),
    ).rejects.toThrow("이미");
    await expect(register("", "입력", "test-pass-123")).rejects.toThrow(
      "아이디",
    );
    const db = await openDB();
    const users = await new Promise<any[]>((resolve) => {
      const r = db.transaction("users").objectStore("users").getAll();
      r.onsuccess = () => resolve(r.result);
    });
    expect(users[0].salt).not.toBe(users[1].salt);
    expect(users[0].verifier).not.toBe(users[1].verifier);
    expect(users[0].iterations).toBeGreaterThan(100000);
    expect(JSON.stringify(users)).not.toContain("test-pass-123");
  });
  it("preserves independent progress/bookmarks/drafts during simultaneous writes", async () => {
    const a = "owner-a",
      b = "owner-b",
      q = questions[0];
    const d = newDraft(a, "practice", "A", [q.id], 60);
    await updateProfile(a, (p) => {
      p.draft = d;
    });
    await Promise.all([
      readLesson(a, "A1", true),
      toggleBookmark(a, q.id, "question"),
      readLesson(b, "B1", true),
      toggleBookmark(b, "B1", "lesson"),
      patchDraft(a, d.id, (x) => {
        x.answers[q.id] = q.correctId!;
      }),
    ]);
    const pa = await getProfile(a),
      pb = await getProfile(b);
    expect(pa.progress.map((x) => x.lessonId)).toEqual(["A1"]);
    expect(pb.progress.map((x) => x.lessonId)).toEqual(["B1"]);
    expect(pb.draft).toBe(null);
    expect(pa.draft!.answers[q.id]).toBe(q.correctId);
    expect(pa.bookmarks[0].userId).toBe(a);
    expect(pb.bookmarks[0].userId).toBe(b);
    expect((await getProfile(a)).draft).toEqual(pa.draft);
  });
  it("submits only once and updates one wrong-note on repeated mistakes then resolution", async () => {
    const owner = "submit-owner",
      q = questions[0];
    const d = newDraft(owner, "practice", "wrong", [q.id], 60);
    await updateProfile(owner, (p) => {
      p.draft = d;
    });
    await Promise.all([submitDraft(owner, d.id), submitDraft(owner, d.id)]);
    let p = await getProfile(owner);
    expect(p.attempts).toHaveLength(1);
    expect(p.wrongNotes).toHaveLength(1);
    expect(p.wrongNotes[0].count).toBe(1);
    const d2 = newDraft(owner, "practice", "wrong again", [q.id], 60);
    await updateProfile(owner, (p) => {
      p.draft = d2;
    });
    await submitDraft(owner, d2.id);
    p = await getProfile(owner);
    expect(p.wrongNotes).toHaveLength(1);
    expect(p.wrongNotes[0].count).toBe(2);
    const d3 = newDraft(owner, "practice", "right", [q.id], 60);
    d3.answers[q.id] = q.correctId!;
    await updateProfile(owner, (p) => {
      p.draft = d3;
    });
    await submitDraft(owner, d3.id);
    expect((await getProfile(owner)).wrongNotes[0].resolved).toBe(true);
  });
  it("blocks late answers and recognizes absolute expired deadlines exactly once", async () => {
    const owner = "timer-owner",
      q = questions[0],
      d = newDraft(owner, "exam", "expired", [q.id], 1);
    d.endsAt = Date.now() - 100;
    await updateProfile(owner, (p) => {
      p.draft = d;
    });
    await patchDraft(owner, d.id, (x) => {
      x.answers[q.id] = q.correctId!;
    });
    expect((await getProfile(owner)).draft!.answers).toEqual({});
    await Promise.all([
      submitDraft(owner, d.id, true),
      submitDraft(owner, d.id),
    ]);
    const p = await getProfile(owner);
    expect(p.attempts).toHaveLength(1);
    expect(p.attempts[0].expired).toBe(true);
    expect(p.attempts[0].score).toBe(0);
  });
  it("does not patch a newer replacement draft or another owner", async () => {
    const d = newDraft("stale-owner", "practice", "new", [questions[0].id], 60);
    await updateProfile("stale-owner", (p) => {
      p.draft = d;
    });
    await patchDraft("stale-owner", "old-id", (x) => {
      x.answers[questions[0].id] = "bad";
    });
    await patchDraft("other-owner", d.id, (x) => {
      x.answers[questions[0].id] = "bad";
    });
    expect((await getProfile("stale-owner")).draft!.answers).toEqual({});
    expect((await getProfile("other-owner")).draft).toBe(null);
  });
  it("requires essay self assessment and finalizes without duplicated attempts", async () => {
    const owner = "essay-owner",
      q = questions.find((q) => q.kind === "essay")!,
      d = newDraft(owner, "practice", "essay", [q.id], 60);
    d.answers[q.id] = "분모와 비교 기간을 확인해야 한다.";
    await updateProfile(owner, (p) => {
      p.draft = d;
    });
    await submitDraft(owner, d.id);
    expect((await getProfile(owner)).attempts[0].score).toBe(null);
    await evaluateEssay(owner, d.id, q.id, false);
    await evaluateEssay(owner, d.id, q.id, false);
    let p = await getProfile(owner);
    expect(p.attempts).toHaveLength(1);
    expect(p.attempts[0].score).toBe(0);
    expect(p.wrongNotes).toHaveLength(1);
    expect(p.wrongNotes[0].count).toBe(1);
    await evaluateEssay(owner, d.id, q.id, true);
    p = await getProfile(owner);
    expect(p.attempts[0].score).toBe(100);
    expect(p.wrongNotes[0].resolved).toBe(true);
  });
  it("exports only one learning profile; validates before mutation and rebinds to current owner", async () => {
    const source = await getProfile("owner-a"),
      json = exportBackup(source);
    for (const secret of [
      "salt",
      "verifier",
      "password",
      "owner-b",
      "qa_user_b",
    ])
      expect(json).not.toContain(secret);
    await importBackup("import-owner", json, "replace");
    let p = await getProfile("import-owner");
    expect(p.userId).toBe("import-owner");
    expect(p.draft!.userId).toBe("import-owner");
    expect(p.progress.every((x) => x.userId === "import-owner")).toBe(true);
    await importBackup("import-owner", json, "merge");
    p = await getProfile("import-owner");
    expect(p.progress).toHaveLength(1);
    expect(p.bookmarks).toHaveLength(1);
    const before = JSON.stringify(p);
    await expect(importBackup("import-owner", "{}", "replace")).rejects.toThrow(
      "형식",
    );
    expect(JSON.stringify(await getProfile("import-owner"))).toBe(before);
    const bad = JSON.parse(json);
    bad.schemaVersion = 99;
    expect(() => validateBackup(JSON.stringify(bad))).toThrow();
    const malformed = JSON.parse(json);
    malformed.profile.draft.questionIds = ["unknown"];
    expect(() => validateBackup(JSON.stringify(malformed))).toThrow();
  });
  it("checks duplicate records, invalid exam deadline and tampered grade summary", () => {
    const p = emptyProfile("tamper"),
      d = newDraft("tamper", "exam", "test", [questions[0].id], 1);
    p.draft = d;
    const x = JSON.parse(exportBackup(p));
    x.profile.draft.endsAt = null;
    expect(() => validateBackup(JSON.stringify(x))).toThrow();
  });
  it("merges guest only on explicit request, without duplicates or affecting a third owner", async () => {
    await readLesson("guest", "F1", true);
    expect((await getProfile("migrate-owner")).progress).toEqual([]);
    await migrateGuest("migrate-owner");
    await migrateGuest("migrate-owner");
    expect((await getProfile("migrate-owner")).progress).toHaveLength(1);
    expect((await getProfile("other-owner")).progress).toEqual([]);
  });
  it("rolls back a failed atomic mutation without pretending it saved", async () => {
    await readLesson("rollback-owner", "A1", true);
    const before = await getProfile("rollback-owner");
    await expect(
      updateProfile("rollback-owner", (p) => {
        p.progress = [];
        throw new Error("simulated failure");
      }),
    ).rejects.toThrow();
    expect(await getProfile("rollback-owner")).toEqual(before);
  });
  it("recomputes imported grades instead of trusting a forged score", async () => {
    const p = await getProfile("submit-owner");
    const x = JSON.parse(exportBackup(p));
    x.profile.attempts[0].score = 100;
    x.profile.attempts[0].correct = 1;
    x.profile.attempts[0].grades[questions[0].id] = true;
    const checked = validateBackup(JSON.stringify(x));
    expect(checked.attempts[0].correct).toBe(0);
    expect(checked.attempts[0].score).toBe(0);
  });
});
