import test from "node:test";
import assert from "node:assert/strict";
import { getSqlFeedbackReaction } from "../src/lib/raymondFeedback.ts";

test("executed SQL only celebrates an exercise after an explicit successful check", () => {
  const result = { ok: true, columns: ["name"], rows: [["Raymond"]] };
  assert.equal(getSqlFeedbackReaction({ result }), "thumbs-up");
  assert.equal(getSqlFeedbackReaction({ result, checkPassed: false }), "patient");
  assert.equal(getSqlFeedbackReaction({ result, checkPassed: true }), "applause");
  assert.equal(getSqlFeedbackReaction({}), "query-ready");
});

test("pending work and new errors override a previous passed check", () => {
  assert.equal(getSqlFeedbackReaction({ running: true, checkPassed: true }), "typing");
  assert.equal(getSqlFeedbackReaction({ error: "Failed to fetch", checkPassed: true }), "debugging");
  assert.equal(getSqlFeedbackReaction({ result: { ok: false, columns: [], rows: [], error: "23503: FK" }, checkPassed: true }), "debugging");
});
