import test from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { createMurderDatabase } from "../src/lib/murder/query.ts";
import { MURDER_TABLES } from "../src/lib/murder/seed.ts";
import { getMurderDdl, MURDER_RELATIONS } from "../src/lib/murder/schema.ts";

const SQL = await initSqlJs();

function pragmaRows(db, pragma) {
  const set = db.exec(pragma)[0];
  return set ? set.values.map((values) => Object.fromEntries(set.columns.map((column, index) => [column, values[index]]))) : [];
}

test("schema keys and FK metadata match the actual SQLite columns, including the composite key", () => {
  const db = createMurderDatabase(SQL);
  try {
    assert.equal(MURDER_TABLES.length, 9);
    for (const table of MURDER_TABLES) {
      const columns = pragmaRows(db, `PRAGMA table_info(${table.name})`);
      const foreignKeys = pragmaRows(db, `PRAGMA foreign_key_list(${table.name})`);
      assert.deepEqual(columns.map((column) => column.name), table.columns.map((column) => column.name), table.name);
      for (const column of table.columns) {
        const actualColumn = columns.find((candidate) => candidate.name === column.name);
        const actualReference = foreignKeys.find((foreignKey) => foreignKey.from === column.name);
        assert.equal(column.type, actualColumn.type, `${table.name}.${column.name}: type`);
        assert.equal(column.key === "PK", actualColumn.pk > 0, `${table.name}.${column.name}: primary key`);
        assert.equal(column.references, actualReference ? `${actualReference.table}.${actualReference.to}` : undefined, `${table.name}.${column.name}: foreign key`);
        if (actualReference && actualColumn.pk === 0) assert.equal(column.key, "FK");
      }
    }
    assert.deepEqual(MURDER_TABLES.find((table) => table.name === "tilmeldinger").columns.map((column) => column.key), ["PK", "PK"]);
    assert.equal(MURDER_TABLES.find((table) => table.name === "afhoeringer").columns[0].key, "PK");
  } finally {
    db.close();
  }
});

test("ER relations cover every SQLite foreign key once and derive the correct parent:child cardinality", () => {
  const db = createMurderDatabase(SQL);
  try {
    const actualRelations = MURDER_TABLES.flatMap((table) => {
      const columns = pragmaRows(db, `PRAGMA table_info(${table.name})`);
      const primaryKeys = columns.filter((column) => column.pk > 0);
      return pragmaRows(db, `PRAGMA foreign_key_list(${table.name})`).map((foreignKey) => ({
        fromTable: table.name,
        fromColumn: foreignKey.from,
        toTable: foreignKey.table,
        toColumn: foreignKey.to,
        cardinality: primaryKeys.length === 1 && primaryKeys[0].name === foreignKey.from ? "1:1" : "1:n",
      }));
    });
    const sortRelations = (relations) => relations.toSorted((a, b) => `${a.fromTable}.${a.fromColumn}`.localeCompare(`${b.fromTable}.${b.fromColumn}`));
    assert.equal(actualRelations.length, 9);
    assert.equal(MURDER_RELATIONS.length, 9);
    assert.equal(new Set(MURDER_RELATIONS.map((relation) => relation.id)).size, 9);
    assert.deepEqual(sortRelations(MURDER_RELATIONS.map(({ id, ...relation }) => relation)), sortRelations(actualRelations));
    assert.deepEqual(MURDER_RELATIONS.filter((relation) => relation.cardinality === "1:1").map((relation) => relation.fromTable), ["afhoeringer"]);
    assert.ok(MURDER_RELATIONS.filter((relation) => relation.fromTable === "tilmeldinger").every((relation) => relation.cardinality === "1:n"));
    assert.ok(MURDER_RELATIONS.every((relation) => relation.fromTable !== "sagsrapporter" && relation.toTable !== "sagsrapporter"));
  } finally {
    db.close();
  }
});

test("exported DDL rebuilds the same nine empty tables with identical columns and foreign keys", () => {
  const original = createMurderDatabase(SQL);
  const rebuilt = new SQL.Database();
  try {
    rebuilt.run("PRAGMA foreign_keys = ON;");
    for (const table of MURDER_TABLES) {
      const ddl = getMurderDdl(table.name);
      assert.match(ddl, new RegExp(`^CREATE TABLE ${table.name} \\(\\n  `));
      assert.match(ddl, /\n\);$/);
      assert.doesNotMatch(ddl, /\bINSERT\b|Rune Falk|Clara Holm|ARKIV-26/i);
      rebuilt.run(ddl);
      assert.equal(rebuilt.exec(`SELECT COUNT(*) FROM ${table.name}`)[0].values[0][0], 0);
      assert.deepEqual(pragmaRows(rebuilt, `PRAGMA table_info(${table.name})`), pragmaRows(original, `PRAGMA table_info(${table.name})`));
      assert.deepEqual(pragmaRows(rebuilt, `PRAGMA foreign_key_list(${table.name})`), pragmaRows(original, `PRAGMA foreign_key_list(${table.name})`));
    }
    assert.equal(rebuilt.exec("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table'")[0].values[0][0], 9);
    assert.match(getMurderDdl("tilmeldinger"), /  PRIMARY KEY \(person_id, session_id\)\n/);
    assert.throws(() => getMurderDdl("personer; SELECT * FROM personer"), /Ukendt tabel/);
  } finally {
    original.close();
    rebuilt.close();
  }
});
