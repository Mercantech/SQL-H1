import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { progressLabel } from "../src/lib/course.ts";

const root = new URL("../../", import.meta.url);
const field = (text, name) => new RegExp(`^${name}: (.+)$`, "m").exec(text)?.[1]?.trim();

test("every course page is reachable, with valid local assets, seeds, checks and lab downloads", () => {
  const modules = JSON.parse(readFileSync(new URL("content/modules.json", root), "utf8"));
  const moduleIds = new Set(modules.map((module) => module.slug));
  const pages = new Map();
  for (const kind of ["lessons", "exercises"]) {
    for (const filename of readdirSync(new URL(`content/${kind}/`, root)).filter((file) => file.endsWith(".md"))) {
      const text = readFileSync(new URL(`content/${kind}/${filename}`, root), "utf8");
      const slug = field(text, "slug");
      assert.ok(slug, filename);
      assert.ok(!pages.has(slug), `Duplicate slug: ${slug}`);
      assert.ok(moduleIds.has(field(text, "module")), `Unknown module: ${filename}`);
      assert.ok(["theory", "exercise", "project"].includes(field(text, "kind")), filename);
      pages.set(slug, text);
      for (const match of text.matchAll(/^\s+(seed|checks): (.+)$/gm)) {
        assert.ok(existsSync(new URL(`content/${match[2].trim()}`, root)), `${filename}: missing ${match[1]}`);
      }
      if (field(text, "kind") === "project") {
        assert.ok(!/^sandbox:/m.test(text), `Local project must not offer SQL check: ${filename}`);
        assert.match(text, /\/downloads\/.+-lab\.zip/, `${filename}: no runnable lab`);
        assert.match(text, /aflev[eé]r/i, `${filename}: no delivery instructions`);
      }
    }
  }
  for (const [slug, text] of pages) {
    for (const match of text.matchAll(/\]\((\/(?:learn|modules|raymond|downloads)\/[^)\s]+)\)/g)) {
      const path = match[1].split("#")[0];
      if (path.startsWith("/learn/")) assert.ok(pages.has(path.slice(7)), `${slug}: broken ${path}`);
      else if (path.startsWith("/modules/")) assert.ok(moduleIds.has(path.slice(9)), `${slug}: broken ${path}`);
      else assert.ok(existsSync(new URL(`web/public${path}`, root)), `${slug}: missing ${path}`);
    }
  }
  const goals = new Set(modules.flatMap((module) => module.goalNumbers ?? []));
  for (let goal = 18; goal <= 24; goal++) assert.ok(goals.has(goal), `No module for goal ${goal}`);
});

test("project readiness is never presented as an automatically passed exercise", () => {
  assert.equal(progressLabel("project", "completed"), "Klar til gennemgang");
  assert.equal(progressLabel("exercise", "completed"), "Bestået");
  assert.equal(progressLabel("theory", "completed"), "Teori åbnet");
});
