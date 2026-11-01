import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getExerciseHints, getRaymondTopic, explainPostgresError } from "../src/lib/raymond.ts";
import { describeSqlResult } from "../src/lib/raymondWork.ts";

const content = new URL("../../content/", import.meta.url);

test("every curriculum module resolves to its own guidance and official source", () => {
  const modules = JSON.parse(readFileSync(new URL("modules.json", content), "utf8"));
  for (const module of modules) {
    const topic = getRaymondTopic(module.slug);
    assert.equal(topic.id, module.slug, module.slug);
    assert.ok(topic.summary.length > 60);
    assert.ok(topic.steps.length >= 3);
    assert.equal(new URL(topic.reference).hostname, "www.postgresql.org");
  }
  assert.equal(getRaymondTopic("/learn/joins-ex-01").id, "joins-subqueries");
  assert.equal(getRaymondTopic("/learn/ddl-ex-02").id, "ddl-er");
  assert.equal(getRaymondTopic("/auth/callback").id, "welcome");
});

test("every authored exercise has three tailored hints, not the fallback", () => {
  const exercisesDir = new URL("exercises/", content);
  const filenames = readdirSync(exercisesDir).filter((name) => name.endsWith(".md"));
  assert.ok(filenames.length >= 20);
  for (const filename of filenames) {
    const markdown = readFileSync(new URL(filename, exercisesDir), "utf8");
    const slug = /^slug: (.+)$/m.exec(markdown)?.[1].trim();
    const module = /^module: (.+)$/m.exec(markdown)?.[1].trim();
    assert.ok(slug && module, filename);
    const hints = getExerciseHints({ slug, module, objectives: [], markdown });
    assert.equal(hints.length, 3, filename);
    assert.equal(new Set(hints).size, 3, filename);
    assert.ok(!hints[0].startsWith("Læs ét krav ad gangen"), `Missing tailored hints: ${filename}`);
  }
});

test("Postgres errors use SQLSTATE even if the server wording changes", () => {
  const fk = explainPostgresError("23503: completamente otra descripción");
  assert.match(fk.explanation, /fremmednøgle/i);
  assert.match(explainPostgresError('42703: column "foo" does not exist').title, /kolonnen/i);
  assert.match(explainPostgresError("42601: syntax error at or near FROM").explanation, /årsagen kan stå lige før/i);
  assert.match(explainPostgresError("23505: duplicate key").explanation, /dublet/i);
  assert.match(explainPostgresError("23502: null value").explanation, /NOT NULL/);
  assert.match(explainPostgresError("42803: grouping error").explanation, /grupperet/i);
});

test("unknown or connection errors never fabricate a precise SQL diagnosis", () => {
  for (const text of ["", "Failed to fetch", "XX000: internal failure", "uventet svar"]) {
    const result = explainPostgresError(text);
    assert.match(result.explanation, /ikke en sikker forklaring/i);
    assert.ok(result.steps.some((step) => step.includes("underviseren")));
  }
  assert.match(explainPostgresError("Skriveadgang er ikke tilladt her").title, /rammer/i);
});

test("new content still gets useful hints without borrowing a different answer", () => {
  const hints = getExerciseHints({ slug: "new-exercise", module: "constraints", objectives: ["Forklare CHECK"], markdown: "" });
  assert.equal(hints.length, 3);
  assert.match(hints[1], /Forklare CHECK/);
});

test("the runtime avatar files exist independently of the original authoring files", () => {
  for (const name of ["professor", "neutral", "success", "error", "help", "thinking", "warning", "celebration"]) {
    const bytes = readFileSync(fileURLToPath(new URL(`../public/raymond/${name}.webp`, import.meta.url)));
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
    assert.ok(bytes.length < 200_000, name);
  }
});

test("AI result context describes execution without sending any row cell values", () => {
  assert.equal(describeSqlResult(null), undefined);
  const summary = describeSqlResult({ ok: true, columns: ["name", "email"], rows: [["PRIVATE_NAME", "PRIVATE_EMAIL"]], truncated: true });
  assert.match(summary, /lykkedes/);
  assert.match(summary, /name, email/);
  assert.match(summary, /1 viste rækker/);
  assert.match(summary, /afkortet/);
  assert.ok(!summary.includes("PRIVATE_"));
  assert.ok(!summary.includes("bestået"));
});

test("AI result context preserves affected row counts and stays bounded", () => {
  const summary = describeSqlResult({ ok: true, columns: [], rows: [], rowsAffected: 4 });
  assert.match(summary, /4 berørte rækker/);
  const longSummary = describeSqlResult({ ok: false, columns: Array(25).fill("x".repeat(200)), rows: [] });
  assert.ok(longSummary.length <= 1200);
  assert.match(longSummary, /fejlede/);
});
