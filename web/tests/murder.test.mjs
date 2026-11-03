import test from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { createMurderDatabase, executeMurderQuery, splitMurderStatements } from "../src/lib/murder/query.ts";
import { checkAccusation, HINTS, MURDER_TABLES, STARTER_SQL } from "../src/lib/murder/seed.ts";
import { createMurderEngine, MURDER_QUERY_TIMEOUT_MS } from "../src/lib/murder/engine.ts";

const SQL = await initSqlJs();

function withDatabase(callback) {
  const db = createMurderDatabase(SQL);
  try { return callback(db); } finally { db.close(); }
}

test("murder schema is relational and agrees with SQLite's actual tables and columns", () => withDatabase((db) => {
  assert.equal(MURDER_TABLES.length, 9);
  assert.deepEqual(db.exec("PRAGMA foreign_key_check"), []);
  for (const table of MURDER_TABLES) {
    const columns = executeMurderQuery(db, `PRAGMA table_info(${table.name})`).sets[0];
    assert.deepEqual(columns.rows.map((row) => row[1]), table.columns.map((column) => column.name));
    const count = executeMurderQuery(db, `SELECT COUNT(*) FROM ${table.name}`).sets[0].rows[0][0];
    assert.ok(count >= 7, `${table.name} includes clues and distractors`);
  }
  assert.equal(db.exec("PRAGMA query_only")[0].values[0][0], 1);
  assert.equal(executeMurderQuery(db, STARTER_SQL).sets[0].rows.length, 4);
}));

test("the complete evidence chain identifies one fictional killer and one fictional mastermind", () => withDatabase((db) => {
  const report = executeMurderQuery(db, HINTS[0].sql).sets[0];
  assert.equal(report.rows.length, 1);
  assert.match(report.rows[0][4], /Anders.*C#-loungen.*Mads.*Sal 2/);

  const witnesses = executeMurderQuery(db, HINTS[1].sql).sets[0].rows;
  assert.deepEqual(witnesses.map((row) => row[0]), ["Anders Hejlsberg", "Mads Torgersen"]);
  assert.match(witnesses[0][1], /DR-7/);
  assert.match(witnesses[1][1], /SQL under pres.*C# uden spor/);

  const cardSuspects = executeMurderQuery(db, HINTS[2].sql).sets[0].rows;
  assert.deepEqual(cardSuspects.map((row) => row[1]).sort(), ["Nikolaj Berg", "Rune Falk"]);
  const killer = executeMurderQuery(db, HINTS[3].sql).sets[0].rows;
  assert.deepEqual(killer, [[8, "Rune Falk"]]);
  const confession = executeMurderQuery(db, "SELECT udskrift FROM afhoeringer WHERE person_id = 8").sets[0].rows[0][0];
  assert.match(confession, /13\. oktober.*75\.000.*ARKIV-26/);

  const mastermind = executeMurderQuery(db, HINTS[4].sql).sets[0].rows;
  assert.equal(mastermind.length, 1);
  assert.equal(mastermind[0][0], "Clara Holm");
  assert.equal(mastermind[0][1], 75000);
  assert.match(mastermind[0][3], /falske konsulentfakturaer.*tavshed for altid/);
}));

test("real SQL supports joins, grouped evidence, CTEs, schemas, comments and multiple result sets", () => withDatabase((db) => {
  const result = executeMurderQuery(db, `
    -- Look up the schema first; comments must not become statements.
    SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;
    /* The semicolon in a string is data, not a query boundary. */
    WITH candidates AS (SELECT person_id FROM tilmeldinger GROUP BY person_id HAVING COUNT(*) >= 3)
    SELECT p.navn, 'a;--b/*c*/' AS note FROM personer p JOIN candidates c ON c.person_id = p.id;
    PRAGMA main.table_info('personer');
    EXPLAIN QUERY PLAN SELECT * FROM personer WHERE id = 8;
  `);
  assert.equal(result.sets.length, 4);
  assert.equal(result.sets[0].rows.length, 9);
  assert.deepEqual(result.sets[1].rows, [["Rune Falk", "a;--b/*c*/"]]);
  assert.equal(result.sets[2].rows.length, 5);
  assert.ok(result.elapsedMs >= 0);
  assert.equal(result.truncated, false);
}));

test("writes and mutable PRAGMAs are rejected before any statement is prepared", () => withDatabase((db) => {
  const attempts = [
    "DELETE FROM personer",
    "UPDATE personer SET navn = 'ændret'",
    "INSERT INTO personer VALUES (99, 'X', 'X', 'X', 'X')",
    "DROP TABLE personer",
    "ATTACH ':memory:' AS other",
    "PRAGMA query_only = OFF",
    "EXPLAIN PRAGMA query_only = OFF",
    "EXPLAIN QUERY PLAN PRAGMA query_only = OFF",
    "EXPLAIN /* surprise */ PRAGMA query_only = OFF",
    "SELECT 1; PRAGMA query_only = OFF; DELETE FROM personer",
    "SELECT 1; /* safe-looking */ PRAGMA writable_schema = ON",
    "PRAGMA table_info(personer); PRAGMA query_only(0)",
    "WITH dummy AS (SELECT 1) DELETE FROM personer",
  ];
  for (const statement of attempts) {
    assert.throws(() => executeMurderQuery(db, statement), undefined, statement);
    assert.equal(db.exec("PRAGMA query_only")[0].values[0][0], 1, statement);
    assert.equal(db.exec("SELECT COUNT(*) FROM personer")[0].values[0][0], 22, statement);
  }
}));

test("large outputs are bounded and empty SELECTs retain their column names", () => withDatabase((db) => {
  const large = executeMurderQuery(db, "WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x < 500) SELECT x FROM n");
  assert.equal(large.sets[0].rows.length, 200);
  assert.equal(large.truncated, true);
  const text = executeMurderQuery(db, "SELECT printf('%05000d', 1) AS long_text");
  assert.equal(text.sets[0].rows[0][0].length, 4001);
  assert.equal(text.truncated, true);
  assert.deepEqual(executeMurderQuery(db, "SELECT id, navn FROM personer WHERE id = -1").sets[0], { columns: ["id", "navn"], rows: [] });
  assert.throws(() => executeMurderQuery(db, "SELECT 1;".repeat(6)), /fem/);
  assert.throws(() => executeMurderQuery(db, "x".repeat(30_001)), /30\.000/);
}));

test("SQL splitting preserves quoted semicolons, escaped quotes and quoted identifiers", () => {
  assert.equal(splitMurderStatements("SELECT 'it''s;here', \"a;b\", [c;d], `e;f`; -- tail").length, 1);
  assert.equal(splitMurderStatements("-- leading\n/* second */ SELECT 1; /* ; */ SELECT 2;\n-- last").length, 2);
  for (const malformed of ["-- comment only", "/* no end", "SELECT 'no end", "SELECT 1\0; DELETE FROM personer"]) {
    assert.throws(() => splitMurderStatements(malformed));
  }
});

test("accusations check full names and distinguish the two stages", () => {
  assert.equal(checkAccusation("  RUNE   FALK ", "killer").correct, true);
  assert.equal(checkAccusation("Clara Holm", "mastermind").correct, true);
  assert.equal(checkAccusation("Clara Holm", "killer").correct, false);
  assert.equal(checkAccusation("Rune", "killer").correct, false);
  assert.equal(checkAccusation("Anders Hejlsberg", "killer").correct, false);
  assert.match(checkAccusation("Rune Falk", "killer").message, /afhøring/);
});

test("a timed-out SQL worker is terminated and the next query creates a fresh database", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const instances = [];
  class FakeWorker {
    terminated = false;
    constructor() { instances.push(this); }
    postMessage(message) { this.request = message; }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage({ data }); }
  }
  const previousWorker = globalThis.Worker;
  globalThis.Worker = FakeWorker;
  const engine = createMurderEngine();
  try {
    const slow = engine.run("WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n) SELECT COUNT(*) FROM n");
    const rejection = assert.rejects(slow, /3 sekunder/);
    instances[0].reply({ id: 0, ready: true });
    await assert.rejects(engine.run("SELECT 1"), /allerede/);
    t.mock.timers.tick(MURDER_QUERY_TIMEOUT_MS);
    await rejection;
    assert.equal(instances[0].terminated, true);

    const next = engine.run("SELECT 1");
    assert.equal(instances.length, 2);
    instances[1].reply({ id: 0, ready: true });
    instances[1].reply({ id: instances[1].request.id, result: { sets: [{ columns: ["1"], rows: [[1]] }], elapsedMs: 1, truncated: false } });
    assert.equal((await next).sets[0].rows[0][0], 1);
    const disposed = engine.run("SELECT 2");
    const closed = assert.rejects(disposed, /lukket/);
    engine.dispose();
    await closed;
    assert.equal(instances[1].terminated, true);
    await assert.rejects(engine.run("SELECT 3"), /lukket/);
  } finally {
    engine.dispose();
    globalThis.Worker = previousWorker;
  }
});

test("fatal initialization failures restart the worker while ordinary SQL errors preserve it", async () => {
  const instances = [];
  class FakeWorker {
    terminated = false;
    constructor() { instances.push(this); }
    postMessage(message) { this.request = message; }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage({ data }); }
  }
  const previousWorker = globalThis.Worker;
  globalThis.Worker = FakeWorker;
  const engine = createMurderEngine();
  const result = { sets: [{ columns: ["count"], rows: [[22]] }], elapsedMs: 1, truncated: false };
  try {
    const failedInit = engine.run("SELECT COUNT(*) FROM personer");
    const initRejection = assert.rejects(failedInit, /indlæses/);
    instances[0].reply({ id: instances[0].request.id, fatal: true, error: "SQL-databasen kunne ikke indlæses." });
    await initRejection;
    assert.equal(instances[0].terminated, true);

    const recovered = engine.run("SELECT COUNT(*) FROM personer");
    assert.equal(instances.length, 2);
    instances[1].reply({ id: 0, ready: true });
    instances[1].reply({ id: instances[1].request.id, result });
    assert.deepEqual(await recovered, result);

    const invalidSql = engine.run("SELECT missing FROM personer");
    const sqlRejection = assert.rejects(invalidSql, /missing/);
    instances[1].reply({ id: instances[1].request.id, error: "no such column: missing" });
    await sqlRejection;
    assert.equal(instances[1].terminated, false);

    const retry = engine.run("SELECT COUNT(*) FROM personer");
    assert.equal(instances.length, 2);
    instances[1].reply({ id: instances[1].request.id, result });
    assert.deepEqual(await retry, result);
  } finally {
    engine.dispose();
    globalThis.Worker = previousWorker;
  }
});
