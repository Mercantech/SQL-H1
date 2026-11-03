import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { createMurderDatabase, executeMurderQuery } from "../lib/murder/query.ts";
import type { MurderWorkerRequest, MurderWorkerResponse } from "../lib/murder/query.ts";

const database = initSqlJs({ locateFile: () => wasmUrl }).then(createMurderDatabase);
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<MurderWorkerRequest>) => void) | null;
  postMessage: (response: MurderWorkerResponse) => void;
};

void database.then(() => scope.postMessage({ id: 0, ready: true })).catch(() => {
  // The request handler reports initialization failures against its request id.
});

scope.onmessage = async ({ data }) => {
  let db;
  try {
    db = await database;
  } catch {
    scope.postMessage({ id: data.id, fatal: true, error: "SQL-databasen kunne ikke indlæses. Kontroller forbindelsen, og prøv igen for at starte en ny database." });
    return;
  }
  try {
    scope.postMessage({ id: data.id, result: executeMurderQuery(db, data.sql) });
  } catch (error) {
    scope.postMessage({ id: data.id, error: error instanceof Error ? error.message : "Forespørgslen kunne ikke køres. Prøv igen." });
  }
};
