import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { MURDER_SEED_SQL } from "./seed.ts";

export type MurderQuerySet = { columns: string[]; rows: (string | number | null)[][] };
export type MurderQueryResult = { sets: MurderQuerySet[]; elapsedMs: number; truncated: boolean };
export type MurderWorkerRequest = { id: number; sql: string };
export type MurderWorkerResponse = { id: number; ready?: boolean; fatal?: boolean; result?: MurderQueryResult; error?: string };

const MAX_SQL_LENGTH = 30_000;
const MAX_STATEMENTS = 5;
const MAX_ROWS = 200;
const MAX_COLUMNS = 80;
const MAX_CELL_LENGTH = 4_000;

function withoutLeadingComments(statement: string): string {
  let remaining = statement.trimStart();
  while (remaining.startsWith("--") || remaining.startsWith("/*")) {
    if (remaining.startsWith("--")) {
      const end = remaining.indexOf("\n");
      remaining = end === -1 ? "" : remaining.slice(end + 1).trimStart();
    } else {
      const end = remaining.indexOf("*/", 2);
      if (end === -1) throw new Error("En SQL-kommentar mangler afslutningen */.");
      remaining = remaining.slice(end + 2).trimStart();
    }
  }
  return remaining;
}

/** Split only outside SQLite strings, quoted identifiers and comments. */
export function splitMurderStatements(sqlText: string): string[] {
  if (sqlText.length > MAX_SQL_LENGTH) throw new Error("Din SQL er for lang. Brug højst 30.000 tegn ad gangen.");
  if (sqlText.includes("\0")) throw new Error("SQL må ikke indeholde nul-tegn.");
  const statements: string[] = [];
  let start = 0;
  let quote = "";
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < sqlText.length; i++) {
    const current = sqlText[i];
    const next = sqlText[i + 1];
    if (lineComment) { if (current === "\n") lineComment = false; continue; }
    if (blockComment) { if (current === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (current === quote) {
        if (quote !== "]" && next === quote) i++;
        else quote = "";
      }
      continue;
    }
    if (current === "-" && next === "-") { lineComment = true; i++; continue; }
    if (current === "/" && next === "*") { blockComment = true; i++; continue; }
    if (current === "'" || current === '"' || current === "`") { quote = current; continue; }
    if (current === "[") { quote = "]"; continue; }
    if (current === ";") {
      const statement = withoutLeadingComments(sqlText.slice(start, i));
      if (statement.trim()) statements.push(statement);
      start = i + 1;
    }
  }
  if (quote) throw new Error("En tekst eller et citeret navn mangler et afsluttende citationstegn.");
  if (blockComment) throw new Error("En SQL-kommentar mangler afslutningen */.");
  const tail = withoutLeadingComments(sqlText.slice(start));
  if (tail.trim()) statements.push(tail);
  if (statements.length === 0) throw new Error("Skriv en SELECT-forespørgsel for at undersøge sagen.");
  if (statements.length > MAX_STATEMENTS) throw new Error("Kør højst fem forespørgsler ad gangen.");
  return statements;
}

function assertReadOnly(statement: string) {
  // Some PRAGMAs run during prepare(), even after EXPLAIN. Validate BEFORE preparing.
  const explained = statement.replace(/^EXPLAIN\s+(?:QUERY\s+PLAN\s+)?/i, "");
  const target = withoutLeadingComments(explained);
  if (/^(SELECT|WITH)\b/i.test(target)) return;
  const identifier = "(?:[A-Za-z_][A-Za-z0-9_]*|'[^']*'|\"[^\"]*\"|`[^`]*`|\\[[^\\]]*\\])";
  const tablePragma = new RegExp(`^PRAGMA\\s+(?:main\\s*\\.\\s*)?(?:table_info|table_xinfo)\\s*\\(\\s*${identifier}\\s*\\)\\s*$`, "i");
  if (tablePragma.test(target) || /^PRAGMA\s+(?:main\s*\.\s*)?table_list\s*$/i.test(target)) return;
  throw new Error("Sagens database er skrivebeskyttet. Brug SELECT, WITH, EXPLAIN eller PRAGMA table_info(tabelnavn).");
}

export function createMurderDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  try {
    db.run(MURDER_SEED_SQL);
    db.run("PRAGMA query_only = ON; PRAGMA hard_heap_limit = 67108864;");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function executeMurderQuery(db: Database, sqlText: string): MurderQueryResult {
  const startedAt = performance.now();
  const statements = splitMurderStatements(sqlText);
  // Validate the entire batch before SQLite sees any statement.
  statements.forEach(assertReadOnly);
  const sets: MurderQuerySet[] = [];
  let truncated = false;
  const normalize = (value: SqlValue): string | number | null => {
    if (value instanceof Uint8Array) return `[BLOB: ${value.byteLength} bytes]`;
    if (typeof value === "string" && value.length > MAX_CELL_LENGTH) {
      truncated = true;
      return `${value.slice(0, MAX_CELL_LENGTH)}…`;
    }
    return value;
  };
  for (const sqlText of statements) {
    const statement = db.prepare(sqlText);
    try {
      const columns = statement.getColumnNames();
      if (columns.length > MAX_COLUMNS) throw new Error("Resultatet har for mange kolonner. Vælg højst 80 kolonner ad gangen.");
      const rows: MurderQuerySet["rows"] = [];
      while (statement.step()) {
        if (rows.length === MAX_ROWS) { truncated = true; break; }
        rows.push(statement.get().map(normalize));
      }
      sets.push({ columns, rows });
    } finally {
      statement.free();
    }
  }
  return { sets, elapsedMs: Math.round((performance.now() - startedAt) * 10) / 10, truncated };
}
