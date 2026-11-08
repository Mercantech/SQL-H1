import test from "node:test";
import assert from "node:assert/strict";
import { buildLearningHome } from "../src/lib/learningHome.ts";

const item = (slug, kind, order) => ({ slug, title: slug, kind, order });
const modules = () => [
  { slug: "later", title: "Senere", description: "", order: 2, scaffoldOnly: false, objectives: [], items: [item("project", "project", 2), item("later-theory", "theory", 1)] },
  { slug: "first", title: "Først", description: "", order: 1, scaffoldOnly: false, objectives: [], items: [item("exercise", "exercise", 2), item("intro", "theory", 1)] },
];
const progress = (contentSlug, status = "completed", day = 1, partIndex = 0) => ({ contentSlug, status, updatedAt: `2026-11-${String(day).padStart(2, "0")}T09:00:00.000Z`, partIndex });

test("a new learner starts at the first real step in curriculum order", () => {
  const model = buildLearningHome(modules(), []);
  assert.equal(model.resume.item.slug, "intro");
  assert.equal(model.resumeReason, "new");
  assert.equal(model.returning, false);
  assert.deepEqual(model.stats, { openedTheory: 0, passedExercises: 0, readyProjects: 0 });
  assert.equal(model.totalItems, 4);
});

test("the latest unfinished activity wins over an earlier unopened lesson and newer completed work", () => {
  const model = buildLearningHome(modules(), [
    progress("exercise", "started", 3), progress("project", "started", 5), progress("later-theory", "completed", 7),
  ]);
  assert.equal(model.resume.item.slug, "project");
  assert.equal(model.resumeReason, "started");
  assert.deepEqual(model.started.map((step) => step.item.slug), ["project", "exercise"]);
  assert.deepEqual(model.recent.map((record) => record.step.item.slug), ["later-theory", "project", "exercise"]);
  assert.equal(model.returning, true);
});

test("the next step follows the latest activity instead of restarting an earlier module", () => {
  const model = buildLearningHome(modules(), [progress("later-theory", "completed", 4)]);
  assert.equal(model.resume.item.slug, "project");
  assert.equal(model.resumeReason, "next");
  const wrap = buildLearningHome(modules(), [progress("project", "completed", 4)]);
  assert.equal(wrap.resume.item.slug, "intro");
  assert.equal(wrap.resumeReason, "next");
});

test("recorded completion of all content offers review without treating theory and projects as passed exercises", () => {
  const model = buildLearningHome(modules(), [progress("intro"), progress("exercise", "completed", 2), progress("later-theory", "completed", 3), progress("project", "completed", 4)]);
  assert.equal(model.resume.item.slug, "project");
  assert.equal(model.resumeReason, "review");
  assert.deepEqual(model.stats, { openedTheory: 2, passedExercises: 1, readyProjects: 1 });
  assert.equal(model.recordedItems, 4);
});

test("only the latest whole-item record counts, and reopening a project removes its ready count", () => {
  const model = buildLearningHome(modules(), [
    progress("project", "completed", 2), progress("project", "started", 4), progress("project", "completed", 8, 1),
    progress("exercise", "completed", 1), progress("exercise", "completed", 2), progress("intro", "started", 1), progress("intro", "completed", 3),
  ]);
  assert.equal(model.resume.item.slug, "project");
  assert.equal(model.recordedItems, 3);
  assert.deepEqual(model.stats, { openedTheory: 1, passedExercises: 1, readyProjects: 0 });
});

test("deleted content, partial records, malformed dates and unknown latest statuses cannot award progress", () => {
  const model = buildLearningHome(modules(), [
    progress("deleted", "started", 9), progress("intro", "completed", 3, 1),
    { ...progress("later-theory"), updatedAt: "invalid" }, progress("exercise", "completed", 2), progress("exercise", "unexpected", 4),
  ]);
  assert.equal(model.returning, false);
  assert.equal(model.resumeReason, "new");
  assert.equal(model.recordedItems, 0);
  assert.deepEqual(model.stats, { openedTheory: 0, passedExercises: 0, readyProjects: 0 });
  assert.deepEqual(buildLearningHome([], [progress("deleted")]), {
    resume: null, resumeReason: null, returning: false, started: [], recent: [], stats: { openedTheory: 0, passedExercises: 0, readyProjects: 0 }, totalItems: 0, recordedItems: 0,
  });
});

test("equal-timestamp conflicting states are conservative and independent of response ordering", () => {
  const rows = [progress("exercise", "started", 5), progress("exercise", "completed", 5)];
  const first = buildLearningHome(modules(), rows);
  const reversed = buildLearningHome(modules(), [...rows].reverse());
  assert.deepEqual(first, reversed);
  assert.equal(first.resumeReason, "started");
  assert.equal(first.stats.passedExercises, 0);
});

test("building the home model never sorts or mutates the source catalog or progress", () => {
  const catalog = modules();
  const rows = [progress("project", "started", 4), progress("intro", "completed", 1)];
  const before = JSON.stringify({ catalog, rows });
  for (const module of catalog) { Object.freeze(module.items); Object.freeze(module); }
  Object.freeze(catalog); Object.freeze(rows);
  buildLearningHome(catalog, rows);
  assert.equal(JSON.stringify({ catalog, rows }), before);
});
