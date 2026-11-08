import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { raymondReactions, raymondReactionCategories, raymondMoodReactions, getRaymondReaction } from "../src/lib/raymondReactions.ts";

const assets = new URL("../public/raymond/reactions/", import.meta.url);

test("every reaction has a unique ID, useful Danish text and a valid local WebP asset", () => {
  assert.equal(raymondReactions.length, 48);
  assert.equal(new Set(raymondReactions.map((item) => item.id)).size, raymondReactions.length);
  const categories = new Set(raymondReactionCategories.map((item) => item.id));
  for (const item of raymondReactions) {
    assert.ok(item.label.trim().length >= 3, item.id);
    assert.ok(item.description.trim().length >= 25, item.id);
    assert.ok(categories.has(item.category), item.id);
    assert.equal(item.src, `/raymond/reactions/${item.id}.webp`);
    const bytes = readFileSync(new URL(`${item.id}.webp`, assets));
    assert.equal(bytes.subarray(0, 4).toString(), "RIFF", item.id);
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP", item.id);
    assert.ok(bytes.length > 1000 && bytes.length < 100_000, `${item.id}: image should stay compact`);
    assert.equal(getRaymondReaction(item.id), item);
  }
  const files = readdirSync(assets).filter((name) => name.endsWith(".webp")).sort();
  assert.deepEqual(files, raymondReactions.map((item) => `${item.id}.webp`).sort());
});

test("execution success, passed exercises and errors keep distinct visual meanings", () => {
  assert.equal(getRaymondReaction(raymondMoodReactions.neutral).id, "query-ready");
  assert.equal(getRaymondReaction(raymondMoodReactions.success).id, "success");
  assert.equal(getRaymondReaction(raymondMoodReactions.celebration).id, "applause");
  assert.equal(getRaymondReaction(raymondMoodReactions.error).id, "debugging");
  assert.equal(new Set(Object.values(raymondMoodReactions)).size, 7);
  for (const id of Object.values(raymondMoodReactions)) assert.equal(getRaymondReaction(id).id, id);
});

test("unknown reaction IDs safely fall back to a calm ready state", () => {
  for (const unknown of [undefined, null, "", "missing", "../../outside", "toString"]) {
    assert.equal(getRaymondReaction(unknown).id, "query-ready");
  }
});
